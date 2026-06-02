import { literalT } from "../i18n/runtimeTamil";import React, { useState } from 'react';
import { Table, Button } from 'react-bootstrap';

const mockUsers = [
{ id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin' },
{ id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User' },
{ id: 3, name: 'Peter Jones', email: 'peter.jones@example.com', role: 'User' }];


function UserManagement() {
  const [users, setUsers] = useState(mockUsers);

  return (
    <div>
      <h2>{literalT("User Management")}</h2>
      <Button variant="primary" className="mb-3">{literalT("Add User")}</Button>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>{literalT("ID")}</th>
            <th>{literalT("Name")}</th>
            <th>{literalT("Email")}</th>
            <th>{literalT("Role")}</th>
            <th>{literalT("Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) =>
          <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <Button variant="warning" size="sm" className="me-2">{literalT("Edit")}</Button>
                <Button variant="danger" size="sm">{literalT("Delete")}</Button>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>);

}

export default UserManagement;
