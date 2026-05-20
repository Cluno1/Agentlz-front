import React, { useEffect, useState } from "react";
import { Modal, Button, Message } from "@arco-design/web-react";
import { useTranslate } from "react-admin";
import { wsClient } from "../data/wsClient";

export const WSMonitor: React.FC = () => {
  const [status, setStatus] = useState(wsClient.getStatus());
  const translate = useTranslate();

  useEffect(() => {
    const unbind = wsClient.onStatus((newStatus) => {
      setStatus(newStatus);
    });
    return unbind;
  }, []);

  const handleReconnect = () => {
    wsClient.connect();
    Message.info(translate("common.websocket.connecting"));
  };

  return (
    <Modal
      title={translate("common.websocket.disconnected")}
      visible={status === "disconnected"}
      footer={
        <Button type="primary" onClick={handleReconnect}>
          {translate("common.websocket.reconnect")}
        </Button>
      }
      closable={false}
      maskClosable={false}
    >
      <p>{translate("common.websocket.disconnectedMessage")}</p>
    </Modal>
  );
};
