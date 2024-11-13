import React from "react";
import {
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiImage,
} from "@elastic/eui";
import logo from "../images/logo.png";

function Navbar() {
  return (
    <EuiHeader style={{ borderBottom: "none", padding: 2, marginTop: 15 }}>
      <EuiHeaderSection side="left">
        <EuiHeaderSectionItem>
          <EuiImage
            size="s"
            alt="Logo"
            src={logo}
            style={{
              height: "60px", // Custom size (increase as needed)
              width: "auto", // Adjust width proportionally
            }}
          />
        </EuiHeaderSectionItem>
      </EuiHeaderSection>
    </EuiHeader>
  );
}

export default Navbar;
