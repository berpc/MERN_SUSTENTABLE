import React, { useState } from "react";
import { Tab, Button } from "semantic-ui-react";
import { BasicModal } from "../../../components/Shared";
import { ListSiteForms, SiteForm } from "../../../components/Admin/SiteForms";
import "./Sites.scss";

export function SiteForms() {
  const [showModal, setShowModal] = useState(false);
  const [reload, setReload] = useState(false);

  const onOpenCloseModal = () => setShowModal((prevState) => !prevState);
  const onReload = () => setReload((prevState) => !prevState);

  const panes = [
    {
      render: () => (
        <Tab.Pane attached={false}>
          <ListSiteForms reload={reload} onReload={onReload} />
        </Tab.Pane>
      ),
    },
  ];

  return (
    <>
      <div className="sites-page">
        <div className="sites-page__add">
          <Button primary onClick={onOpenCloseModal}>
            Nuevo Sitio
          </Button>
        </div>

        <Tab menu={{ secondary: true }} panes={panes} />
      </div>

      <BasicModal show={showModal} close={onOpenCloseModal} title="Site General" size={"fullscreen"}>
        <SiteForm onClose={onOpenCloseModal} onReload={onReload} />
      </BasicModal>
    </>
  );
}
