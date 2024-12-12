import React, { useState, useEffect } from "react";
import {
  Loader,
  Search,
  Grid,
  GridColumn,
  Divider,
  Dropdown,
  Input,
  Icon,
  Table,
  Button
} from "semantic-ui-react";
import { size, map } from "lodash";
import { Permission, Company } from "../../../../api";
import { useAuth } from "../../../../hooks";
import { CompanyItem } from "../CompanyItem";
import { hasPermission, isAdmin, isMaster } from "../../../../utils/checkPermission";
import { ErrorAccessDenied } from "../../../../pages/admin/Error";
import { useLanguage } from "../../../../contexts";
const _ = require("lodash");

const companyController = new Company();
const permissionController = new Permission();

export function ListCompanies(props) {
  const { companiesActive, reload, onReload } = props;
  const [ companies, setCompanies ] = useState(null);
  const [ companiesFilter, setCompaniesFilter ] = useState(null);

  const {
    accessToken,
    user: { role },
  } = useAuth();

  const { language, changeLanguage, translations } = useLanguage();
  
  const t = (key) => translations[key] || key ; // Función para obtener la traducción

  const [permissionByRole, setPermissionsByRole] = useState([]);

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

  useEffect(() => {
    (async () => {
      try {
        setCompanies(null);
        setCompaniesFilter([]);
        const response = await companyController.getCompanies(
          accessToken,
          companiesActive
        );
        let result=response.map(s => ({ ...s, key: s._id }));
        setCompanies(result);
        setCompaniesFilter(result);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [companiesActive, reload, accessToken]);

  if (!companies) return <Loader active inline="centered" />;
  if (size(companies) === 0) return t("not_companies");

  return (
    <div>
      {isMaster(role) ||
      hasPermission(permissionByRole, role._id, "companies", "view") ? (
        <div>
          <div>
            <SearchStandardCompany
              dataOrigin={companies}
              data={companiesFilter}
              setData={setCompaniesFilter}
            />
          </div>
          <Divider clearing />
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("company_name")}</Table.HeaderCell>
                <Table.HeaderCell>{t("email")}</Table.HeaderCell>
                <Table.HeaderCell>{t("actions")}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
            {map(companiesFilter, (company) => (
            <CompanyItem key={company._id} company={company} onReload={onReload} />
          ))}
           </Table.Body>
           </Table>
        </div>
      ) : (
        <ErrorAccessDenied />
      )}
    </div>
  );
}

function SearchStandardCompany(props) {
  const { dataOrigin, data, setData } = props;
  const [state, setState] = useState({
    isLoading: false,
    results: [],
    value: "",
  });

  const [filter, setFilter] = useState("name");

  const handleChange = (e, { name, value }) => {
    setFilter(value);
    setData(dataOrigin);
    setState({ value: "" });
  };


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
      // const re = new RegExp(_.escapeRegExp(value), "i");
      // const isMatch = (result) => re.test(result[filter]);
      const filteredData = dataOrigin.filter(item =>
        Object.values(item).some(v =>
          v.toString().toLowerCase().includes(value.toLowerCase())
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

  // const options = [
  //   {
  //     key: 1,
  //     text: "Nombre",
  //     value: "name",
  //   },
  //   {
  //     key: 2,
  //     text: "CUIT",
  //     value: "cuit",
  //   },
  //   {
  //     key: 3,
  //     text: "Email",
  //     value: "email",
  //   },
  // ];

  return (
    <Grid>
      <GridColumn width={4}>
      <Input
     icon='search'
     iconPosition='left'
    placeholder='Buscar...'
    onChange={_.debounce(handleSearchChange, 500, {
      leading: true,
    })}
    // action={
    //   <Dropdown
    //         onChange={handleChange}
    //         options={options}
    //         value={filter}
    //         button basic floating
    //         />
    // }
  />
      </GridColumn>
    </Grid>
  );
}

const EditableTable = () => {
  const [data, setData] = useState([
    { id: 1, name: 'John Doe', age: 30 },
    { id: 2, name: 'Jane Smith', age: 25 },
    // Add more initial data as needed
  ]);
  
  const handleEdit = (id, field, value) => {
    const newData = data.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setData(newData);
  };

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Age</Table.HeaderCell>
          <Table.HeaderCell>Action</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map(item => (
          <Table.Row key={item.id}>
            <Table.Cell>
              <input
                type="text"
                value={item.name}
                onChange={e => handleEdit(item.id, 'name', e.target.value)}
              />
            </Table.Cell>
            <Table.Cell>
              <input
                type="number"
                value={item.age}
                onChange={e => handleEdit(item.id, 'age', e.target.value)}
              />
            </Table.Cell>
            <Table.Cell>
              <Button color="red">Delete</Button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};


const EditableTable2 = () => {
  const [data, setData] = useState([
    { id: 1, name: 'John Doe', age: 30, gender: 'Male' },
    { id: 2, name: 'Jane Smith', age: 25, gender: 'Female' },
    // Add more initial data as needed
  ]);

  const genders = [
    { key: 'male', text: 'Male', value: 'Male' },
    { key: 'female', text: 'Female', value: 'Female' },
  ];

  const handleEdit = (id, field, value) => {
    const newData = data.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setData(newData);
  };

  return (
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Age</Table.HeaderCell>
          <Table.HeaderCell>Gender</Table.HeaderCell>
          <Table.HeaderCell>Action</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map(item => (
          <Table.Row key={item.id}>
            <Table.Cell>
              <input
                type="text"
                value={item.name}
                onChange={e => handleEdit(item.id, 'name', e.target.value)}
              />
            </Table.Cell>
            <Table.Cell>
              <input
                type="number"
                value={item.age}
                onChange={e => handleEdit(item.id, 'age', e.target.value)}
              />
            </Table.Cell>
            <Table.Cell>
              <Dropdown
                selection
                options={genders}
                value={item.gender}
                onChange={(e, { value }) => handleEdit(item.id, 'gender', value)}
              />
            </Table.Cell>
            <Table.Cell>
              <Button color="red">Delete</Button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};
