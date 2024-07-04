import React, { useState, useEffect } from "react";
import {
  Loader,
  Search,
  Grid,
  GridColumn,
  Divider,
  Input,
  Icon,
  Table
} from "semantic-ui-react";
import { size, map } from "lodash";
import { Permission, Role } from "../../../../api";
import { useAuth } from "../../../../hooks";
import { PermissionItem } from "../PermissionItem";
import { RoleItem } from "../RoleItem";
import { hasPermission, isAdmin, isMaster } from "../../../../utils/checkPermission";
import { ErrorAccessDenied } from "../../../../pages/admin/Error";
import { convertActionsEngToEsp, convertModulesEngToEsp } from "../../../../utils/converts";
const _ = require("lodash");

const permissionController = new Permission();
const roleController = new Role();

export function ListPermissions(props) {
  const { isByRoles, permissionsActive, reload, onReload } = props;
  const [permissions, setPermissions] = useState([]);

  // const [Role, setRole] = useState(null);
  const {
    user: { role },
    accessToken,
  } = useAuth();

  const [permissionsByRole, setPermissionsByRole] = useState([]);

  const [listRoles, setListRoles] = useState([]);

  const [listRolesFilter, setListRolesFilter] = useState([]);
  const [permissionsFilter, setPermissionsFilter] = useState([]);

  const [column, setColumn] = useState(null);
  const [data, setData] = useState(/* Your data array */);
  const [direction, setDirection] = useState(null);

  const handleSort = (clickedColumn) => () => {
    if (column !== clickedColumn) {
      setColumn(clickedColumn);
      setData([...data].sort((a, b) => a[clickedColumn] > b[clickedColumn] ? 1 : -1));
      setDirection('ascending');
      return;
    }

    setData(data.reverse());
    setDirection(direction === 'ascending' ? 'descending' : 'ascending');
  };


  useEffect(() => {
    (async () => {
      try {
        setListRoles([]);
        setPermissions([]);
        if (isByRoles) {
          const response = await roleController.getRoles(accessToken, true);
          setListRoles(response);
          setListRolesFilter(response);
        } else {
          const response = await permissionController.getPermissions(
            accessToken
          );
          //
          setPermissions(response);
          setPermissionsFilter(response);
        }
      } catch (error) {
        console.error(error);
        setListRoles([]);
        setPermissions([]);
        setPermissionsFilter([]);
        setListRolesFilter([]);
      }
    })();
  }, [isByRoles, permissionsActive, reload]);

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

  if (
    isByRoles &&
    ( isMaster(role) || isAdmin(role) ||
      hasPermission(permissionsByRole, role._id, "permissions", "view"))
  ) {
    if (!listRoles) return <Loader active inline="centered" />;
    if (size(listRoles) === 0) return "No hay ningun rol";
    return (
      <div>
        <div>
          <SearchStandardRole
            dataOrigin={listRoles}
            data={listRolesFilter}
            setData={setListRolesFilter}
          />
        </div>
        <Divider clearing/>
        <div>
          {map(listRolesFilter, (role) => (
            <RoleItem key={role._id} role={role} onReload={onReload} />
          ))}
        </div>
      </div>
    );
  } else if (
    !isByRoles &&
    (isMaster(role) || isAdmin(role) ||
      hasPermission(permissionsByRole, role._id, "permissions", "view"))
  ) {
    if (!permissions) return <Loader active inline="centered" />;
    if (size(permissions) === 0) return "No hay ningun permiso";
    return (
      <div>
        <div>
          <SearchStandardPermission
            dataOrigin={permissions}
            data={permissionsFilter}
            setData={setPermissionsFilter}
          />
        </div>
        <Divider clearing/>
        <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell >Rol</Table.HeaderCell>
                <Table.HeaderCell>Modulo</Table.HeaderCell>
                <Table.HeaderCell>Accion</Table.HeaderCell>
                <Table.HeaderCell>Acciones</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
          {map(permissionsFilter, (permission) => (
            <PermissionItem
              key={permission._id}
              permission={permission}
              onReload={onReload}
            />
          ))}
           </Table.Body>
           </Table>
      </div>
    );
  } else {
    return <ErrorAccessDenied />;
  }
}

function SearchStandardRole(props) {
  const { dataOrigin, data, setData } = props;
  const [state, setState] = useState({
    isLoading: false,
    results: [],
    value: "",
  });

  const handleSearchChange = (e, { value }) => {
    setState({ isLoading: true, value });

    setTimeout(() => {
      if (value && value.length < 1) {
        setState({ isLoading: false, results: [], value: "" });
        setData(dataOrigin);
        return true;
      } else if (value.length === 0) {
        setData(dataOrigin);
        setState({ isLoading: false, results: [], value: "" });
        return true;
      }
      const re = new RegExp(_.escapeRegExp(value), "i");
      const isMatch = (result) => re.test(result.name);
      setState({
        isLoading: false,
        results: _.filter(data, isMatch),
      });
      setData(_.filter(data, isMatch));
    }, 300);
  };

  return (
    <Grid>
      <GridColumn width={6}>
      <Input
       icon='search'
       iconPosition='left'
      placeholder='Buscar...'
    onChange={_.debounce(handleSearchChange, 500, {
      leading: true,
    })}
  />
      </GridColumn>
    </Grid>
  );
}

function SearchStandardPermission(props) {
  const { dataOrigin, data, setData } = props;
  const [state, setState] = useState({
    isLoading: false,
    results: [],
    value: "",
  });

  const handleSearchChange = (e, { value }) => {
    setState({ isLoading: true, value });

    setTimeout(() => {
      if (value && value.length < 1) {
        setState({ isLoading: false, results: [], value: "" })
        setData(dataOrigin);
        return true;
      } else if (value.length === 0) {
        setData(dataOrigin);
        setState({ isLoading: false, results: [], value: "" });
        return true;
      }
      // const re = new RegExp(_.escapeRegExp(value), "i");
      // const isMatch = (result) => re.test(result.role.name);
      // setState({
      //   isLoading: false,
      //   results: _.filter(data, isMatch),
      // });
      const filteredData = dataOrigin.filter(item =>
        Object.keys(item).some(k =>{
          if(k === "module"){
            return convertModulesEngToEsp(item[k]).toString().toLowerCase().includes(value.toLowerCase())
          }else if(k === "action"){
            return convertActionsEngToEsp(item[k]).toString().toLowerCase().includes(value.toLowerCase())
          }else{
            return item[k].toString().toLowerCase().includes(value.toLowerCase())
          }
        }
          
        )
      );
      setState({
        isLoading: false,
        // results: _.filter(data, isMatch),
        results:filteredData
      });
      setData(filteredData);
    }, 300);
  };


  return (
    <Grid>
      <GridColumn width={6}>
      <Input
       icon='search'
       iconPosition='left'
      placeholder='Buscar...'
    onChange={_.debounce(handleSearchChange, 500, {
      leading: true,
    })}
        />
      </GridColumn>
    </Grid>
  );
}
