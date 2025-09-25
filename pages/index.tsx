import React from "react";
import BoswellRun from "../components/BoswellRun";
import AccessGate from "../components/AccessGate";  // Add this line

export default function Home() {
  return (
    <AccessGate>
      <BoswellRun />
    </AccessGate>
  );
}