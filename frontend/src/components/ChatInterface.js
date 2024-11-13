// frontend/src/components/ChatInterface.js

import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiFieldText,
  EuiButton,
  EuiCallOut,
  EuiOverlayMask,
  EuiModal,
  EuiModalHeader,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeaderTitle,
  EuiPanel,
} from "@elastic/eui";
import PropTypes from "prop-types";

function ChatInterface({
  sessionId,
  items,
  setItems,
  setTotalPrice,
  timeUp,
  setHasAcceptedSolution,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isProposedSolutionPending, setIsProposedSolutionPending] =
    useState(false);
  const [pendingProposedSolution, setPendingProposedSolution] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const socketRef = useRef();

  useEffect(() => {
    console.log("ChatInterface: sessionId =", sessionId);
    if (!sessionId) {
      setError("No session ID found. Please log in.");
      return;
    }

    // Initialize the Socket.IO connection
    const socket = io(process.env.REACT_APP_BACKEND_URL, {
      query: { token: sessionId },
      transports: ["websocket"],
      path: "/socket.io",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setError("");
      console.log("Socket connected");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Socket connection failed. Please try again.");
    });

    socket.on("message", (message) => {
      console.log("Received message:", message);
      if (message && message.content) {
        let parsedMessage;

        // Attempt to parse the message as JSON
        try {
          parsedMessage = JSON.parse(message.content);
        } catch (e) {
          // If parsing fails, treat it as a plain text message
          parsedMessage = { content: message.content };
        }

        if (
          parsedMessage.podiums &&
          parsedMessage.overall_total !== undefined
        ) {
          // Handle structured message
          setItems(
            parsedMessage.podiums.map((p) => ({
              podium: p.podium,
              item_name: p.item_name,
              item_price: p.item_price,
              quantity: p.quantity,
            }))
          );
          setTotalPrice(parsedMessage.overall_total);

          parsedMessage.podiums.forEach((podium) => {
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                content: `Podium ${podium.podium}: ${podium.quantity} x ${
                  podium.item_name
                } @ $${podium.item_price.toFixed(2)} each`,
              },
            ]);
          });

          if (parsedMessage.proposed_solution) {
            setPendingProposedSolution({
              podiums: parsedMessage.podiums,
              overall_total: parsedMessage.overall_total,
            });
            setIsProposedSolutionPending(true);
            setHasAcceptedSolution(false);
          }
        } else if (parsedMessage.content) {
          // Handle plain text message
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              content: parsedMessage.content,
            },
          ]);
        }
      }
    });

    socket.on("disconnect", () => {
      console.warn("Socket disconnected");
      setError("Socket disconnected. Please refresh the page.");
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, setItems, setTotalPrice, setHasAcceptedSolution]);

  const sendMessage = () => {
    if (input.trim() === "") return;
    setMessages((prev) => [...prev, { sender: "user", content: input }]);
    socketRef.current.emit("message", { content: input });
    setInput("");
  };

  return (
    <EuiFlexGroup direction="column" gutterSize="m">
      {error && (
        <EuiCallOut title="Connection Error" color="danger" iconType="alert">
          {error}
        </EuiCallOut>
      )}
      {alertMessage && (
        <EuiCallOut title="Alert" color="warning" iconType="help">
          {alertMessage}
        </EuiCallOut>
      )}
      <EuiPanel style={{ height: "300px", overflowY: "auto" }}>
        <EuiText>
          {messages.map((msg, idx) => (
            <p key={idx}>
              <strong>{msg.sender === "user" ? "You" : "Bot"}:</strong>{" "}
              {msg.content}
            </p>
          ))}
        </EuiText>
      </EuiPanel>
      {!timeUp && (
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFieldText
              placeholder="Type your message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton fill onClick={sendMessage}>
              Send
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      )}

      {isProposedSolutionPending && (
        <EuiOverlayMask>
          <EuiModal onClose={() => setIsProposedSolutionPending(false)}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>Proposed Solution</EuiModalHeaderTitle>
            </EuiModalHeader>
            <EuiModalBody>
              {pendingProposedSolution.podiums.map((podium, idx) => (
                <EuiText key={idx}>
                  <p>
                    <strong>Podium {podium.podium}:</strong> {podium.quantity} x{" "}
                    {podium.item_name} @ ${podium.item_price.toFixed(2)}
                  </p>
                </EuiText>
              ))}
              <EuiText>
                <h3>
                  Overall Total: $
                  {pendingProposedSolution.overall_total.toFixed(2)}
                </h3>
              </EuiText>
            </EuiModalBody>
            <EuiModalFooter>
              <EuiButton
                onClick={() => setIsProposedSolutionPending(false)}
                fill
              >
                Accept
              </EuiButton>
              <EuiButton
                color="danger"
                onClick={() => setIsProposedSolutionPending(false)}
              >
                Modify
              </EuiButton>
            </EuiModalFooter>
          </EuiModal>
        </EuiOverlayMask>
      )}
    </EuiFlexGroup>
  );
}

ChatInterface.propTypes = {
  sessionId: PropTypes.string,
  items: PropTypes.array.isRequired,
  setItems: PropTypes.func.isRequired,
  setTotalPrice: PropTypes.func.isRequired,
  timeUp: PropTypes.bool.isRequired,
  setHasAcceptedSolution: PropTypes.func.isRequired,
};

export default ChatInterface;
