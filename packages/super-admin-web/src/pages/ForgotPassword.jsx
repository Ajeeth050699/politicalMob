import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      alert(data.message);
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  return (
    <Container className="auth-container">
      <Row>
        <Col md="12">
          <div className="auth-form">
            <h2 className="text-center">Forgot Password</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formBasicEmail">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">
                  We'll send a password reset link to your email.
                </Form.Text>
              </Form.Group>
              <Button variant="primary" type="submit" className="w-100 mt-3">
                Send Reset Link
              </Button>
            </Form>
            <div className="text-center mt-3">
              Remember your password? <Link to="/login">Login</Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default ForgotPassword;
