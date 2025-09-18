import './App.css'

import React, { useEffect, useState } from "react";
import { on, removeListener } from 'alt1';

type WrapperProps = {
  children: React.ReactNode
}

function Alt1Wrapper ({ children }: WrapperProps) {
  const [alt1Exists, setAlt1Exists] = useState(false);
    const [permissions, setPermissions] = useState<{ permissionInstalled: boolean, permissionGameState: boolean, permissionOverlay: boolean, permissionPixel: boolean }>({
    permissionInstalled: window.alt1.permissionInstalled,
    permissionGameState: window.alt1.permissionGameState,
    permissionOverlay: window.alt1.permissionOverlay,
    permissionPixel: window.alt1.permissionPixel
  });

  useEffect(() => {
    if (window.alt1) {
      window.alt1.identifyAppUrl("./appconfig.json");
      setAlt1Exists(true);
    }
  }, []);

  // Monitor alt1 permission changes
  useEffect(() => {
    const getPermissons = () => {
      setPermissions({
        permissionInstalled: window.alt1.permissionInstalled,
        permissionGameState: window.alt1.permissionGameState,
        permissionPixel: window.alt1.permissionPixel,
        permissionOverlay: window.alt1.permissionOverlay,
      });
    };
    const permHandler = () => {
      getPermissons();
    };
    on("permissionchanged", permHandler);
    return () => removeListener("permissionchanged", permHandler);
  }, [permissions]);

  if (!permissions.permissionInstalled || !permissions.permissionGameState || !permissions.permissionPixel || !permissions.permissionOverlay) {
    return (
      <div className="app-container">
        <div className="status-panel">
          <h3>Better Combat Bars</h3>
          <div className="status-info">
            <div className="status-item">
              <span className={`status-indicator ${window.alt1 ? 'ready' : 'loading'}`}></span>
              Alt1: {window.alt1 ? 'Connected' : 'Not detected'}
            </div>
            <div className="status-item">
              <span className={`status-indicator ${permissions.permissionInstalled ? 'ready' : 'loading'}`}></span>
              Permission Installed: {permissions.permissionInstalled ? 'Granted' : 'Not granted'}
            </div>
            <div className="status-item">
              <span className={`status-indicator ${permissions.permissionGameState ? 'ready' : 'loading'}`}></span>
              Permission Game State: {permissions.permissionGameState ? 'Granted' : 'Not granted'}
            </div>
            <div className="status-item">
              <span className={`status-indicator ${permissions.permissionPixel ? 'ready' : 'loading'}`}></span>
              Permission View Screen: {permissions.permissionPixel ? 'Granted' : 'Not granted'}
            </div>
            <div className="status-item">
              <span className={`status-indicator ${permissions.permissionOverlay ? 'ready' : 'loading'}`}></span>
              Permission Overlay: {permissions.permissionOverlay ? 'Granted' : 'Not granted'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (alt1Exists) {
    return (
      <>
        {children}
      </>
    );
  } else {
    const appUrl = `alt1://addapp/${new URL("./appconfig.json", document.location.href).href}`;

    return (
      <div>
        Alt1 not detected, click <a href={appUrl}>here</a> to add this app to Alt1
      </div>
    );
  }

};

export default Alt1Wrapper;