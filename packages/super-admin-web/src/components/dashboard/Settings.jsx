import { literalT } from "../../i18n/runtimeTamil";import React from 'react';

function Settings() {
  return (
    <div>
      <h2>{literalT("Settings")}</h2>
      <p>{literalT("Manage your account and application settings here.")}</p>
    </div>);

}

export default Settings;
