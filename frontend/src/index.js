// src/index.js

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { registerOTel } from "./otel";
import "./App.css";

registerOTel();

ReactDOM.render(<App />, document.getElementById("root"));
