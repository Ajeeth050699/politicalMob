import { literalT } from "./i18n/runtimeTamil";import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';

function Layout() {
  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/">{literalT("Web Admin")}</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">{literalT("Home")}</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link as={Link} to="/login">{literalT("Login")}</Nav.Link>
              <Nav.Link as={Link} to="/signup">{literalT("Sign Up")}</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <Outlet />
      </Container>
    </div>);

}

export default Layout;
