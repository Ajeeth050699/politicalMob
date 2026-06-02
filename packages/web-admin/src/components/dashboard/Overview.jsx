import { literalT } from "../../i18n/runtimeTamil";import React from 'react';

function Overview() {
  return (
    <div>
      <h2>{literalT("Dashboard Overview")}</h2>
      <p>{literalT("Welcome to your dashboard. Here's a summary of your application.")}</p>
    </div>);

}

export default Overview;
