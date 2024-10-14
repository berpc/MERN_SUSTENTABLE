import React, { useState, useEffect } from "react";
import {
  Tab,
  Button,
  Table,
  Divider,
  Icon,
  Segment,
  Header,
} from "semantic-ui-react";
import { BasicModal } from "../../../components/Shared";
import { ListKPIsForms, KPIsForm } from "../../../components/Admin/KPIsForms";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks";
import { Site } from "../../../api";
import { encrypt, decrypt } from "../../../utils/cryptoUtils";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  hasPermission,
  isAdmin,
  isMaster,
} from "../../../utils/checkPermission";
import "./KPIsForms.scss";

const siteController = new Site();

export function KPIsForms() {
  const [showModal, setShowModal] = useState(false);
  const [reload, setReload] = useState(false);
  const {
    accessToken,
    user: { role, site },
  } = useAuth();
  const [sitesFilter, setSitesFilter] = useState([]);
  const [siteSelected, setSiteSelected] = useState(null);

  const [yearSelected, setYearSelected] = useState(new Date().getFullYear());

  const onOpenCloseModal = () => setShowModal((prevState) => !prevState);
  const onReload = () => setReload((prevState) => !prevState);

  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        if (!site && !location.state?.siteSelected) {
          const response = await siteController.getSites(accessToken);
          setSitesFilter(response);
        }
      } catch (error) {
        console.error(error);
        setSitesFilter([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (location.state?.siteSelected) {
          setSiteSelected(decrypt(location.state.siteSelected));
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [location]);

  const handleSelected = (idSite) => {
    setSiteSelected(idSite._id);
  };

  const panes = [
    {
      render: () => (
        <Tab.Pane attached={false}>
          {siteSelected === null &&
          (isMaster(role) || (isAdmin(role) && !site)) ? (
            <SelectedListSites
              sitesFilter={sitesFilter}
              handleSelected={handleSelected}
            />
          ) : !site && siteSelected !== null ? (
            <ListKPIsForms
              reload={reload}
              onReload={onReload}
              siteSelected={siteSelected}
              yearSelected={yearSelected}
            />
          ) : (
            <ListKPIsForms
              reload={reload}
              onReload={onReload}
              siteSelected={site?._id || null}
              yearSelected={yearSelected}
            />
          )}
        </Tab.Pane>
      ),
    },
  ];

  return (
    <>
      <div className="kpis-forms-page">
        <Segment textAlign="center">
          {" "}
          <Header as="h">KPIs</Header>
        </Segment>
        <div className="kpis-forms-page__add">
          {siteSelected !== null || site ? (
            //      <Link to={"/admin/kpisforms/newkpisform"} state= {{siteSelected: encrypt(siteSelected) }}
            // >
            <Button primary onClick={onOpenCloseModal}>
              <Icon name="plus" /> Nuevo Formulario KPIs
            </Button>
          ) : // </Link>
          null}
        </div>

        <Tab menu={{ secondary: true }} panes={panes} />
      </div>

      <BasicModal
        show={showModal}
        close={onOpenCloseModal}
        title="Formulario Energia"
        size={"fullscreen"}
      >
        <KPIsForm
          onClose={onOpenCloseModal}
          onReload={onReload}
          year={yearSelected}
          siteSelected={siteSelected}
        />
      </BasicModal>
    </>
  );
}

function SelectedListSites(props) {
  const { sitesFilter, role, permissionByRole, handleSelected } = props;

  return (
    <div>
      {/* { isMaster(role) || isAdmin(role) ||
      hasPermission(permissionByRole, role._id, "sites", "view") ? ( */}
      <div>
        <div>
          {/* <SearchStandardSite
              dataOrigin={sites}
              data={sitesFilter}
              setData={setSitesFilter}
            /> */}
        </div>
        <Divider clearing />

        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Razon Social</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Acciones</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sitesFilter.map((site) => (
              <Table.Row key={site._id}>
                <Table.Cell>{site.name ? site.name : ""}</Table.Cell>
                <Table.Cell>{site.email}</Table.Cell>
                <Table.Cell>
                  {
                    // isMaster(role) || isAdmin(role) ||
                    // hasPermission(permissionsByRole, role._id, "sites", "edit") ? (
                    <Button
                      icon
                      primary
                      onClick={() => {
                        handleSelected(site);
                      }}
                    >
                      <Icon name="angle double right" />
                    </Button>
                    // ) : null
                  }
                  {/* {isMaster(role) || isAdmin(role) ||
                    hasPermission(permissionsByRole, role._id, "sites", "edit") ? (
                      <Button
                        icon
                        color={site.active ? "orange" : "teal"}
                        onClick={openDesactivateActivateConfim}
                      >
                        <Icon name={site.active ? "ban" : "check"} />
                      </Button>
                    ) : null} */}
                  {/* {isMaster(role) || isAdmin(role) ||
                    hasPermission(permissionsByRole, role._id, "sites", "delete") ? (
                      <Button icon color="red" onClick={openDeleteConfirm}>
                        <Icon name="trash" />
                      </Button>
                    ) : null} */}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
      {/* ) : (
        // <ErrorAccessDenied />
        <></>
      )} */}
    </div>
  );
}
