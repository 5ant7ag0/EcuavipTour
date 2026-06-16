import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SoapService {
  private wsUrl = 'http://localhost:5001/ws';

  constructor(private http: HttpClient) {}

  post(namespace: string, localPart: string, payload: any, token?: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'text/xml; charset=utf-8',
      'Authorization': token ? `Bearer ${token}` : ''
    });

    const xmlPayload = this.jsonToXml(payload, namespace, localPart);
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns="${namespace}">
  <soapenv:Header/>
  <soapenv:Body>
    ${xmlPayload}
  </soapenv:Body>
</soapenv:Envelope>`;

    return this.http.post(this.wsUrl, soapEnvelope, { headers, responseType: 'text' }).pipe(
      map(responseXml => {
        const responseTagName = localPart.replace('Request', 'Response');
        return this.xmlToJson(responseXml, responseTagName);
      }),
      catchError(err => {
        let errorMessage = 'Error de conexión o del servidor';
        
        // Handle HttpErrorResponse (SOAP Fault returned in 500/401/403 status code)
        if (err && err.error && typeof err.error === 'string') {
          if (err.error.includes('<faultstring') || err.error.includes('<faultcode')) {
            try {
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(err.error, 'text/xml');
              const faultElement = xmlDoc.getElementsByTagName('SOAP-ENV:Fault')[0] || 
                                   xmlDoc.getElementsByTagName('soap:Fault')[0] || 
                                   xmlDoc.getElementsByTagName('Fault')[0];
              if (faultElement) {
                errorMessage = faultElement.getElementsByTagName('faultstring')[0]?.textContent || 'Error del servidor SOAP';
              }
            } catch (e) {
              console.error('Error parsing SOAP Fault XML:', e);
            }
          } else {
            errorMessage = err.error || err.message || 'Error del servidor';
          }
        } else if (err && err.message) {
          // Local/Parsing/network connection errors
          errorMessage = err.message;
        }

        // Return standard error object that matches the frontend components expectations
        return throwError(() => ({
          error: {
            error: errorMessage
          }
        }));
      })
    );
  }

  private jsonToXml(obj: any, namespace: string, rootName: string): string {
    let xml = `<ns:${rootName}>`;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key];
        if (val === null || val === undefined) {
          continue;
        }
        if (Array.isArray(val)) {
          val.forEach(item => {
            if (typeof item === 'object') {
              xml += this.jsonToXmlInner(item, key);
            } else {
              xml += `<ns:${key}>${this.escapeXml(item)}</ns:${key}>`;
            }
          });
        } else if (typeof val === 'object') {
          xml += this.jsonToXmlInner(val, key);
        } else {
          xml += `<ns:${key}>${this.escapeXml(val)}</ns:${key}>`;
        }
      }
    }
    xml += `</ns:${rootName}>`;
    return xml;
  }

  private jsonToXmlInner(obj: any, rootName: string): string {
    let xml = `<ns:${rootName}>`;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const val = obj[key];
        if (val === null || val === undefined) {
          continue;
        }
        if (Array.isArray(val)) {
          val.forEach(item => {
            if (typeof item === 'object') {
              xml += this.jsonToXmlInner(item, key);
            } else {
              xml += `<ns:${key}>${this.escapeXml(item)}</ns:${key}>`;
            }
          });
        } else if (typeof val === 'object') {
          xml += this.jsonToXmlInner(val, key);
        } else {
          xml += `<ns:${key}>${this.escapeXml(val)}</ns:${key}>`;
        }
      }
    }
    xml += `</ns:${rootName}>`;
    return xml;
  }

  private escapeXml(unsafe: any): string {
    if (typeof unsafe !== 'string') {
      return String(unsafe);
    }
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  private xmlToJson(xmlString: string, responseTagName: string): any {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for SOAP Faults
    const faultElement = xmlDoc.getElementsByTagName('SOAP-ENV:Fault')[0] || 
                         xmlDoc.getElementsByTagName('soap:Fault')[0] || 
                         xmlDoc.getElementsByTagName('Fault')[0];
    if (faultElement) {
      const faultString = faultElement.getElementsByTagName('faultstring')[0]?.textContent || 'SOAP Error';
      throw new Error(faultString);
    }

    const responseElement = xmlDoc.getElementsByTagName(responseTagName)[0] || 
                            xmlDoc.getElementsByTagNameNS('*', responseTagName)[0];
    if (!responseElement) {
      return null;
    }
    return this.domToObj(responseElement);
  }

  private domToObj(node: Element): any {
    let hasChildElements = false;
    for (let i = 0; i < node.childNodes.length; i++) {
      if (node.childNodes[i].nodeType === 1) { // ELEMENT_NODE
        hasChildElements = true;
        break;
      }
    }
    if (!hasChildElements) {
      const text = node.textContent?.trim() ?? '';
      if (text === 'true') return true;
      if (text === 'false') return false;
      if (text !== '' && !isNaN(Number(text))) return Number(text);
      return text;
    }

    const obj: any = {};
    const pluralTags = ['viajes', 'pagos', 'chats', 'usuarios', 'messages', 'asientos', 'vehiculos', 'gastos', 'viajes_programados', 'reservas'];

    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i] as Element;
      if (child.nodeType === 1) { // ELEMENT_NODE
        const name = child.localName || child.nodeName;
        const val = this.domToObj(child);
        if (obj[name] !== undefined) {
          if (!Array.isArray(obj[name])) {
            obj[name] = [obj[name]];
          }
          obj[name].push(val);
        } else {
          if (pluralTags.includes(name)) {
            obj[name] = [val];
          } else {
            obj[name] = val;
          }
        }
      }
    }
    return obj;
  }
}
