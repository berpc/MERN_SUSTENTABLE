import React, { useState, useEffect } from "react";
import { Tab, Button } from "semantic-ui-react";
import { BasicModal } from "../../../components/Shared";
import { RoleForm, ListRoles } from "../../../components/Admin/Roles";
import "./Roles.scss";
import { useAuth } from "../../../hooks";
import { Permission } from "../../../api";
import { isAdmin, hasPermission } from "../../../utils/checkPermission";
import { ErrorAccessDenied } from "../Error";

const permissionController = new Permission();

export function Roles() {
  const [showModal, setShowModal] = useState(false);
  const [reload, setReload] = useState(false);

  const {
    accessToken,
    user: { role },
  } = useAuth();

  const [permissionsByRole, setPermissionsByRole] = useState([]);

  const onOpenCloseModal = () => setShowModal((prevState) => !prevState);
  const onReload = () => setReload((prevState) => !prevState);

  useEffect(() => {
    (async () => {
      try {
        setPermissionsByRole([]);
        if (role) {
          const response = await permissionController.getPermissionsByRole(
            accessToken,
            role._id,
            true
          );
          setPermissionsByRole(response);
        }
      } catch (error) {
        console.error(error);
        setPermissionsByRole([]);
      }
    })();
  }, [role]);

  const panes = [
    {
      menuItem: "Roles activos",
      render: () => (
        <Tab.Pane attached={false}>
          <ListRoles rolesActive={true} reload={reload} onReload={onReload} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: "Roles inactivos",
      render: () => (
        <Tab.Pane attached={false}>
          <ListRoles rolesActive={false} reload={reload} onReload={onReload} />
        </Tab.Pane>
      ),
    },
  ];

  if (
    isAdmin(role) ||
    hasPermission(permissionsByRole, role._id, "roles", "view")
  ) {
    return (
      <>
        <div className="roles-page">
          {isAdmin(role) ||
          hasPermission(permissionsByRole, role._id, "roles", "create") ? (
            <Button
              className="roles-page__add"
              primary
              onClick={onOpenCloseModal}
            >
              Nuevo rol
            </Button>
          ) : null}
          <Tab menu={{ secondary: true }} panes={panes} />
        </div>

        <BasicModal
          show={showModal}
          close={onOpenCloseModal}
          title="Crear nuevo rol"
        >
          <RoleForm close={onOpenCloseModal} onReload={onReload} />
        </BasicModal>
      </>
    );
  } else {
    <ErrorAccessDenied />;
  }
}
