import React from "react";
import Elastic from "../images/logo.png";
import Microsoft from "../images/microsoft2.png";
import { Link } from "react-router-dom";


function Navbar() {
  return (
    <div>
      <Link to="/" className="main-logo">
        <img src={Elastic} alt="Logo Elastic" />
        <img src={Microsoft} className="microsoft-logo" alt="Logo Microsoft" />
      </Link>
    </div>
  );
}

export default Navbar;
