import React from "react";
import logo from "../images/logo.png";
import { Link } from "react-router-dom";


function Navbar() {
  return (
    <div>
      <Link to="/" className="main-logo">
        <img src={logo} alt="Logo" />
      </Link>
    </div>
  );
}

export default Navbar;
