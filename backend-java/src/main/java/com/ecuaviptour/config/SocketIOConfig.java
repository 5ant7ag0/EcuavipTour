package com.ecuaviptour.config;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

/**
 * Socket.IO Server Configuration.
 * Binds the Socket.IO engine to a custom port (e.g. 5002) to run alongside the Tomcat HTTP port (5001).
 */
@org.springframework.context.annotation.Configuration
public class SocketIOConfig {

    @Value("${app.socket.host:0.0.0.0}")
    private String host;

    @Value("${app.socket.port:5002}")
    private Integer port;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(host);
        config.setPort(port);
        // Allow all origins for seamless CORS integration
        config.setOrigin("*");
        
        // Add ping settings for persistent connections
        config.setPingInterval(25000);
        config.setPingTimeout(60000);
        
        return new SocketIOServer(config);
    }
}
