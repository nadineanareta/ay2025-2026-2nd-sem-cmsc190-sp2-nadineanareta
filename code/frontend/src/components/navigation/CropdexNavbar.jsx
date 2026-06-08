//DEPRECATED CODE
// This code is no longer in use and has been replaced SpidHiveNavbar.jsx

import React, { useRef, useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Dropdown,
  DropdownButton,
} from "react-bootstrap";
import { BsPersonFill } from "react-icons/bs";
import { UserContext } from "../context/UserContext";

const CropdexNavbar = () => {
  const { userData, setUserData } = useContext(UserContext);

  let navigate = useNavigate();
  function changeLocation(placeToGo) {
    navigate(placeToGo);
    navigate(0);
  }

  function logout() {
    Cookies.remove("cdexuser");
    setUserData(null);
    setCookieChecked(false);
    changeLocation("/");
  }
  const [cookieChecked, setCookieChecked] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cookie = Cookies.get("cdexuser");
        const user = await fetch(
          "http://localhost:3001/users/get-user-details",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${cookie}`,
              "Content-Type": "application/json",
            },
          }
        );
        const userJson = await user.json();
        setUserData(userJson);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setCookieChecked(true);
    };
    fetchData();
  }, []);

  return (
    <Navbar className="nav-bar-bg text-light" sticky="top">
      <Container>
        <Navbar.Brand
          as={Link}
          to={userData ? "/home" : "/"}
          className="text-white d-flex align-items-center"
        >
          <img
            alt=""
            src="/logo512.png"
            width="70"
            height="70"
            className="d-inline-block align-top"
          />{" "}
          <span>
            <span className="spidhive-font">SPIDHIVE</span>
            <span className="spidtech-subtext">powered by SpidTech+</span>
          </span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="container-fluid">
            {/* <Nav.Link
              as={Link}
              to="/"
              onClick={() => changeLocation("/")}
              className="text-white"
            >
              Home
            </Nav.Link> */}
            {cookieChecked &&
            userData !== null &&
            userData.access_level_id >= 4 ? (
              <Nav.Link as={Link} to="/crops" className="text-white">
                Crop Data Set
              </Nav.Link>
            ) : null}
            {cookieChecked &&
            userData !== null &&
            userData.access_level_id >= 6 ? (
              <Nav.Link as={Link} to="/labels" className="text-white">
                Crop Labels
              </Nav.Link>
            ) : null}
            {cookieChecked &&
            userData !== null &&
            userData.access_level_id >= 4 ? (
              <Nav.Link as={Link} to="/statistics" className="text-white">
                Statistics
              </Nav.Link>
            ) : null}
            {cookieChecked && userData === null ? (
              <Nav.Link as={Link} to="/login" className="ms-auto text-white">
                <button className="login-btn">LOGIN</button>
              </Nav.Link>
            ) : null}
            {cookieChecked && userData !== null ? (
              <div className="ms-auto d-flex align-items-center">
                <BsPersonFill className="me-2" />
                <span className="me-2">Welcome, {userData.display_name}</span>
                <DropdownButton
                  id="account-dropdown"
                  variant=""
                  drop="down-centered"
                >
                  <Dropdown.Item>My Account</Dropdown.Item>
                  <Dropdown.Item>My Annotations</Dropdown.Item>
                  <Dropdown.Item onClick={() => logout()}>Logout</Dropdown.Item>
                </DropdownButton>
              </div>
            ) : null}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CropdexNavbar;
