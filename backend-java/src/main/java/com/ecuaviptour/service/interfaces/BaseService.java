package com.ecuaviptour.service.interfaces;

import java.util.List;

/**
 * Contrato base para todos los servicios CRUD.
 *
 * @param <T> Entidad
 * @param <ID> Tipo del identificador
 */
public interface BaseService<T, ID> {

    List<T> listar();

    T obtener(ID id);

    T guardar(T entity);

    void eliminar(ID id);
}
