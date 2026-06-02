import { literalT } from "../i18n/runtimeTamil";import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import './Auth.css';

const TN_DISTRICTS = [
'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanyakumari', 'Karur',
'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
'Viluppuram', 'Virudhunagar'];


function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [district, setDistrict] = useState('Chennai');
  const [ward, setWard] = useState('');
  const [tamilNaduAccess, setTamilNaduAccess] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      alert('Enter a valid 10-digit contact number.');
      return;
    }
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        phone,
        password,
        role: 'superadmin',
        district,
        ward: ward || undefined,
        tamilNaduAccess
      });
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/dashboard/overview');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <Container className="auth-container">
      <Row>
        <Col md="12">
          <div className="auth-form">
            <h2 className="text-center">{literalT("Sign Up")}</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formBasicName">
                <Form.Label>{literalT("Name")}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={literalT("Enter name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required />
                
              </Form.Group>

              <Form.Group controlId="formBasicEmail">
                <Form.Label>{literalT("Email address")}</Form.Label>
                <Form.Control
                  type="email"
                  placeholder={literalT("Enter email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required />
                
              </Form.Group>

              <Form.Group controlId="formBasicPhone">
                <Form.Label>{literalT("Contact Number")}</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder={literalT("10-digit mobile number")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required />
                
              </Form.Group>

              <Form.Group controlId="formBasicPassword">
                <Form.Label>{literalT("Password")}</Form.Label>
                <Form.Control
                  type="password"
                  placeholder={literalT("Password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required />
                
              </Form.Group>

              <Form.Group controlId="formBasicConfirmPassword">
                <Form.Label>{literalT("Confirm Password")}</Form.Label>
                <Form.Control
                  type="password"
                  placeholder={literalT("Confirm Password")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required />
                
              </Form.Group>

              <Form.Group controlId="formBasicDistrict">
                <Form.Label>{literalT("District")}</Form.Label>
                <Form.Select value={district} onChange={(e) => setDistrict(e.target.value)}>
                  {TN_DISTRICTS.map((item) =>
                  <option key={item} value={item}>{item}</option>
                  )}
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="formBasicWard">
                <Form.Label>{literalT("Thokuthi / Constituency (optional)")}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={literalT("Example: Sivakasi")}
                  value={ward}
                  onChange={(e) => setWard(e.target.value)} />
                
              </Form.Group>

              <Form.Check
                className="mt-3"
                id="tamilNaduAccess"
                type="checkbox"
                label={literalT("Tamil Nadu overall access")}
                checked={tamilNaduAccess}
                onChange={(e) => setTamilNaduAccess(e.target.checked)} />
              
              <p className="text-muted mt-2 mb-0" style={{ fontSize: 13 }}>{literalT("Admin signup does not need ward number or pincode.")}

              </p>
              <Button variant="primary" type="submit" className="w-100 mt-3">{literalT("Sign Up")}

              </Button>
            </Form>
            <div className="text-center mt-3">{literalT("Already have an account?")}
              <Link to="/login">{literalT("Login")}</Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>);

}

export default Signup;
