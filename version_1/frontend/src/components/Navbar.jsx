import React from "react";
import Elastic from "../images/logo.png";
import { Link } from "react-router-dom";


function Navbar() {
  return (
    <div>
      <Link to="/" className="main-logo">
        <img src={Elastic} alt="Logo Elastic" />
      </Link>
    </div>
  );
}

export default Navbar;
