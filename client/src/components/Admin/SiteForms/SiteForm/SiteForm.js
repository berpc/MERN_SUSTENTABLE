import React, { useCallback, useState,useEffect } from "react";
import {
  Form,
  Image,
  Grid,
  Table,
  Icon,
  Button,
  Comment,
  CommentGroup,
  CommentMetadata,
  GridRow,
  GridColumn,
  Segment,
  Divider,
  Header,
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions
} from "semantic-ui-react";
import { useDropzone } from "react-dropzone";
import { useFormik, Field, FieldArray, FormikProvider, getIn } from "formik";
import { Siteform } from "../../../../api";
import { useAuth } from "../../../../hooks";
import { ENV, PERIODS } from "../../../../utils";
import {
  formatDateView,
  formatDateHourCompleted,
} from "../../../../utils/formatDate";
import { BasicModal } from "../../../Shared";
import { initialValues, validationSchema } from "./SiteForm.form";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { decrypt, encrypt } from "../../../../utils/cryptoUtils";
import "./SiteForm.scss";
import { convertPeriodsEngToEsp, convertSiteFieldsEngToEsp } from "../../../../utils/converts";
import { siteCodes } from "../../../../utils/codes";

const siteFormController = new Siteform();

export function SiteForm(props) {
  const { onClose, onReload, siteForm, siteSelected ,period, year} = props;
  const { accessToken } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [titleModal, setTitleModal] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [listPeriods, setListPeriods] = useState([]);
  const { user } = useAuth();

  const location = useLocation();
  //const { siteSelected } = location.state || {};

  if (!siteSelected) {
    // // Manejo de caso donde no hay datos en state (por ejemplo, acceso directo a la URL)
    // return <div>No se encontraron detalles de producto.</div>;
  }

  const navigate = useNavigate();

  const onOpenCloseModal = () => setShowModal((prevState) => !prevState);
  const onOpenCloseConfirm = () => setShowConfirm((prevState) => !prevState);

  const openUpdateSite = (data, name) => {
    setFieldName(name);
    setTitleModal(`Comentarios ${data}`);
    onOpenCloseModal();
  };

  const formik = useFormik({
    initialValues: initialValues(siteForm, period, year),
    validationSchema: validationSchema(),
    validateOnChange: false,
    onSubmit: async (formValue) => {
      try {
        if (!siteForm) {
          formValue.creator_user = user._id;
          formValue.date = new Date();
          if (user?.site) {
            formValue.site = user.site._id;
          } else {
            if (siteSelected) {
              formValue.site = siteSelected;
            }
            // } else {
            //   // Desencriptar los datos recibidos
            //   if (!siteForm) {
            //     const siteData = decrypt(siteSelected);
            //     formValue.site = siteData;
            //   }
            // }
          }
          await siteFormController.createSiteForm(accessToken, formValue);
          //console.log(formValue);
        } else {
          await siteFormController.updateSiteForm(
            accessToken,
            siteForm._id,
            formValue
          );
        }
        onReload();
        if (onClose) {
          onClose();
        } else {
          // Después de guardar exitosamente, navegamos hacia atrás
          goBack();
        }
      } catch (error) {
        console.error(error);
      }
    },
  });

  const goBack = () => {
    navigate(`/admin/data/siteforms`, {
      state: { siteSelected: siteSelected },
    });
  };

     // Generar una lista de años (por ejemplo, del 2000 al 2024)
     const currentYear = new Date().getFullYear();
     const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

     useEffect(() => {
      (async () => {
        try {
          const response =
            await siteFormController.getPeriodsSiteFormsBySiteAndYear(
              accessToken,
              siteSelected,
              formik.values.year
            );
            const periods = PERIODS.map((item) => item);
            const availablePeriods = periods
              .filter((period) => !response.periods.includes(period))
              .map((period) => period);
    
            setListPeriods(availablePeriods);
            console.log(availablePeriods)
        } catch (error) {
          console.error(error);
          setListPeriods([]);
        }
      })();
    }, [formik.values.year]);

  return (
    <Form className="site-form" onSubmit={formik.handleSubmit}>
      {siteForm ? (
        <Segment>
          <Header as="h4"> Fecha: {formatDateView(formik.values.date)}</Header>
          <Header as="h4">
            Usuario creador:{" "}
            {formik.values.creator_user
              ? formik.values.creator_user.lastname
                ? formik.values.creator_user.lastname +
                  " " +
                  formik.values.creator_user.firstname
                : formik.values.creator_user.email
              : null}{" "}
          </Header>
        </Segment>
      ) : null}
             {!siteForm ? (
        <>
          <Grid columns={2} divided>
            <GridRow>
              <GridColumn>
                <Form.Dropdown
                  label="Año"
                  placeholder="Seleccione"
                  options={years.map((year) => {
                    return {
                      key: year,
                      text: year,
                      value: year,
                    };
                  })}
                  selection
                  onChange={(_, data) =>
                    formik.setFieldValue("year", data.value)
                  }
                  value={formik.values.year}
                  error={formik.errors.year}
                />
              </GridColumn>
              <GridColumn>
                <Form.Dropdown
                  label="Periodo"
                  placeholder="Seleccione"
                  options={listPeriods.map((period) => {
                    return {
                      key: period,
                      text: convertPeriodsEngToEsp(period),
                      value: period,
                    };
                  })}
                  selection
                  onChange={(_, data) =>
                    formik.setFieldValue("period", data.value)
                  }
                  value={formik.values.period}
                  error={formik.errors.period}
                />
              </GridColumn>
            </GridRow>
          </Grid>
        </>
      ) : null}
      <Table size="small" celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell width="1">Codigo</Table.HeaderCell>
            <Table.HeaderCell width="6">Concepto</Table.HeaderCell>
            <Table.HeaderCell width="3">Valor</Table.HeaderCell>
            <Table.HeaderCell width="2">Estado</Table.HeaderCell>
            <Table.HeaderCell>Acciones</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell> <label className="label">
                {formik.values.installation_type.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">{convertSiteFieldsEngToEsp("installation_type")}</label>
            </Table.Cell>
            <Table.Cell>
              <Form.Dropdown
                placeholder="Seleccione"
                options={[{ _id: "tipo a", name: "tipo a" }].map((ds) => {
                  return {
                    key: ds._id,
                    text: ds.name,
                    value: ds._id,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("installation_type.value", data.value)
                }
                value={formik.values.installation_type.value}
                error={formik.errors.installation_type}
              />
            </Table.Cell>
            <Table.Cell>

              <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("installation_type.isApproved", data.value)
                }
                value={formik.values.installation_type.isApproved}
                error={formik.errors.installation_type}
              />
              {/* {formik.values.installation_type.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(convertSiteFieldsEngToEsp("installation_type"), "installation_type");
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"installation_type"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.product_category.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">{convertSiteFieldsEngToEsp("product_category")}</label>
            </Table.Cell>
            <Table.Cell>
            <Form.Dropdown
                placeholder="Seleccione"
                options={[{_id:"categoria a",name:"categoria a"}, {_id:"categoria b",name:"categoria b"}].map((ds) => {
                  return {
                    key: ds._id,
                    text: ds.name,
                    value: ds._id,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("product_category.value", data.value)
                }
                value={formik.values.product_category.value}
                error={formik.errors.product_category}
              />
            </Table.Cell>
            <Table.Cell>
              <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("product_category.isApproved", data.value)
                }
                value={formik.values.product_category.isApproved}
                error={formik.errors.product_category}
              />
              {/* {formik.values.product_category.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                primary
                type="button"
                onClick={() => {
                  openUpdateSite(convertSiteFieldsEngToEsp("product_category"), "product_category");
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"product_category"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.days_month.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">{convertSiteFieldsEngToEsp("days_month")}</label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="days_month.value"
                onChange={formik.handleChange}
                value={formik.values.days_month.value}
                error={formik.errors.days_month}
              />
            </Table.Cell>
            <Table.Cell>
              <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("days_month.isApproved", data.value)
                }
                value={formik.values.days_month.isApproved}
                error={formik.errors.days_month}
              />
              {/* {formik.values.days_month.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(convertSiteFieldsEngToEsp("days_month"), "days_month");
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"days_month"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.days_total.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">{convertSiteFieldsEngToEsp("days_total")}</label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="days_total.value"
                onChange={formik.handleChange}
                value={formik.values.days_total.value}
                error={formik.errors.days_total}
              />
            </Table.Cell>
            <Table.Cell>
                 <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("days_total.isApproved", data.value)
                }
                value={formik.values.days_total.isApproved}
                error={formik.errors.days_total}
              />
              {/* {formik.values.days_total.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite("Dias totales trabajados", "days_total");
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"days_total"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.hours_month.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">{convertSiteFieldsEngToEsp("hours_month")}</label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="hours_month.value"
                onChange={formik.handleChange}
                value={formik.values.hours_month.value}
                error={formik.errors.hours_month}
              />
            </Table.Cell>
            <Table.Cell>
                     <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("hours_month.isApproved", data.value)
                }
                value={formik.values.hours_month.isApproved}
                error={formik.errors.hours_month}
              />
              {/* {formik.values.hours_month.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(convertSiteFieldsEngToEsp("hours_month"), "hours_month");
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"hours_month"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.hours_total.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">{convertSiteFieldsEngToEsp("hours_total")}</label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="hours_total.value"
                disabled={true}
                onChange={formik.handleChange}
                value={formik.values.hours_total.value}
                error={formik.errors.hours_total}
              />
            </Table.Cell>
            <Table.Cell>
                         <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("hours_total.isApproved", data.value)
                }
                value={formik.values.hours_total.isApproved}
                error={formik.errors.hours_total}
              />
              {/* {formik.values.hours_total.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite( convertSiteFieldsEngToEsp("hours_total"), "hours_total");
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"hours_total"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.temporary_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
              {convertSiteFieldsEngToEsp("temporary_workers")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="temporary_workers.value"
                onChange={formik.handleChange}
                value={formik.values.temporary_workers.value}
                error={formik.errors.temporary_workers}
              />
            </Table.Cell>
            <Table.Cell>
              {/* <Form.Checkbox
                toggle
                checked={formik.values.temporary_workers.isApproved}
                label={
                  formik.values.temporary_workers.isApproved
                    ? "Aprobado"
                    : "Aprobado"
                }
                onChange={(e, { checked }) => {
                  formik.setFieldValue("temporary_workers.isApproved", checked);
                }}
              /> */}
                           <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("temporary_workers.isApproved", data.value)
                }
                value={formik.values.temporary_workers.isApproved}
                error={formik.errors.temporary_workers}
              />
              {/* {formik.values.temporary_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("temporary_workers"),
                    "temporary_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"temporary_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.permanent_production_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                {convertSiteFieldsEngToEsp("permanent_production_workers")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="permanent_production_workers.value"
                onChange={formik.handleChange}
                value={formik.values.permanent_production_workers.value}
                error={formik.errors.permanent_production_workers}
              />
            </Table.Cell>
            <Table.Cell>
                               <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("permanent_production_workers.isApproved", data.value)
                }
                value={formik.values.permanent_production_workers.isApproved}
                error={formik.errors.permanent_production_workers}
              />
              {/* {formik.values.permanent_production_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("permanent_production_workers"),
                    "permanent_production_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"permanent_production_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.permanent_administrative_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                Cantidad de trabajadores administrativos permanentes
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="permanent_administrative_workers.value"
                onChange={formik.handleChange}
                value={formik.values.permanent_administrative_workers.value}
                error={formik.errors.permanent_administrative_workers}
              />
            </Table.Cell>
            <Table.Cell>
                              <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("permanent_administrative_workers.isApproved", data.value)
                }
                value={formik.values.permanent_administrative_workers.isApproved}
                error={formik.errors.permanent_administrative_workers}
              />
              {/* {formik.values.permanent_administrative_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    "Cantidad de trabajadores administrativos permanentes",
                    "permanent_administrative_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"permanent_administrative_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.female_production_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                {convertSiteFieldsEngToEsp("female_production_workers")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="female_production_workers.value"
                onChange={formik.handleChange}
                value={formik.values.female_production_workers.value}
                error={formik.errors.female_production_workers}
              />
            </Table.Cell>
            <Table.Cell>
                                 <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("female_production_workers.isApproved", data.value)
                }
                value={formik.values.female_production_workers.isApproved}
                error={formik.errors.female_production_workers}
              />
              {/* {formik.values.female_production_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("female_production_workers"),
                    "female_production_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"female_production_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.male_production_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                {convertSiteFieldsEngToEsp("male_production_workers")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="male_production_workers.value"
                onChange={formik.handleChange}
                value={formik.values.male_production_workers.value}
                error={formik.errors.male_production_workers}
              />
            </Table.Cell>
            <Table.Cell>
                                    <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("male_production_workers.isApproved", data.value)
                }
                value={formik.values.male_production_workers.isApproved}
                error={formik.errors.male_production_workers}
              />
              {/* {formik.values.male_production_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("male_production_workers"),
                    "male_production_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"male_production_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.female_administrative_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                {convertSiteFieldsEngToEsp("female_administrative_workers")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="female_administrative_workers.value"
                onChange={formik.handleChange}
                value={formik.values.female_administrative_workers.value}
                error={formik.errors.female_administrative_workers}
              />
            </Table.Cell>
            <Table.Cell>
                                        <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("female_administrative_workers.isApproved", data.value)
                }
                value={formik.values.female_administrative_workers.isApproved}
                error={formik.errors.female_administrative_workers}
              />
              {/* {formik.values.female_administrative_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("female_administrative_workers"),
                    "female_administrative_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"female_administrative_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.male_administrative_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                {convertSiteFieldsEngToEsp("male_administrative_workers")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="male_administrative_workers.value"
                onChange={formik.handleChange}
                value={formik.values.male_administrative_workers.value}
                error={formik.errors.male_administrative_workers}
              />
            </Table.Cell>
            <Table.Cell>
                                          <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("male_administrative_workers.isApproved", data.value)
                }
                value={formik.values.male_administrative_workers.isApproved}
                error={formik.errors.male_administrative_workers}
              />
              {/* {formik.values.male_administrative_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("male_administrative_workers"),
                    "male_administrative_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"male_administrative_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.female_workers_leadership_positions.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
              {convertSiteFieldsEngToEsp("female_workers_leadership_positions")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="female_workers_leadership_position.value"
                onChange={formik.handleChange}
                value={formik.values.female_workers_leadership_positions.value}
                error={formik.errors.female_workers_leadership_positions}
              />
            </Table.Cell>
            <Table.Cell>
                                       <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("female_workers_leadership_positions.isApproved", data.value)
                }
                value={formik.values.female_workers_leadership_positions.isApproved}
                error={formik.errors.female_workers_leadership_positions}
              />
              {/* {formik.values.female_workers_leadership_positions.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("female_workers_leadership_positions"),
                    "female_workers_leadership_positions"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"female_workers_leadership_positions"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.male_workers_leadership_positions.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                {convertSiteFieldsEngToEsp("male_workers_leadership_positions")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="male_workers_leadership_positions.value"
                onChange={formik.handleChange}
                value={formik.values.male_workers_leadership_positions.value}
                error={formik.errors.male_workers_leadership_positions}
              />
            </Table.Cell>
            <Table.Cell>
              <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("male_workers_leadership_positions.isApproved", data.value)
                }
                value={formik.values.male_workers_leadership_positions.isApproved}
                error={formik.errors.male_workers_leadership_positions}
              />
              {/* {formik.values.male_workers_leadership_positions.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("male_workers_leadership_positions"),
                    "male_workers_leadership_positions"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"male_workers_leadership_positions"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.average_total_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                {convertSiteFieldsEngToEsp("average_total_workers")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="average_total_workers.value"
                onChange={formik.handleChange}
                value={formik.values.average_total_workers.value}
                error={formik.errors.average_total_workers}
              />
            </Table.Cell>
            <Table.Cell>
              <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("average_total_workers.isApproved", data.value)
                }
                value={formik.values.average_total_workers.isApproved}
                error={formik.errors.average_total_workers}
              />
              {/* {formik.values.average_total_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("average_total_workers"),
                    "average_total_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"average_total_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.average_female_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                {convertSiteFieldsEngToEsp("average_female_workers")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="average_female_workers.value"
                onChange={formik.handleChange}
                value={formik.values.average_female_workers.value}
                error={formik.errors.average_female_workers}
              />
            </Table.Cell>
            <Table.Cell>
               <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("average_female_workers.isApproved", data.value)
                }
                value={formik.values.average_female_workers.isApproved}
                error={formik.errors.average_female_workers}
              />
              {/* {formik.values.average_female_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("average_female_workers"),
                    "average_female_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"average_female_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.average_male_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                {convertSiteFieldsEngToEsp("average_male_workers")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="average_male_workers.value"
                onChange={formik.handleChange}
                value={formik.values.average_male_workers.value}
                error={formik.errors.average_male_workers}
              />
            </Table.Cell>
            <Table.Cell>
                     <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("average_male_workers.isApproved", data.value)
                }
                value={formik.values.average_male_workers.isApproved}
                error={formik.errors.average_male_workers}
              />
              {/* {formik.values.average_male_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("average_male_workers"),
                    "average_male_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"average_male_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.percentage_female_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">{convertSiteFieldsEngToEsp("percentage_female_workers")}</label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="percentage_female_workers.value"
                onChange={formik.handleChange}
                value={formik.values.percentage_female_workers.value}
                error={formik.errors.percentage_female_workers}
              />
            </Table.Cell>
            <Table.Cell>
              <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("percentage_female_workers.isApproved", data.value)
                }
                value={formik.values.percentage_female_workers.isApproved}
                error={formik.errors.percentage_female_workers}
              />
              {/* {formik.values.percentage_female_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("percentage_female_workers"),
                    "percentage_female_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"percentage_female_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.percentage_male_workers.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label"> {convertSiteFieldsEngToEsp("percentage_male_workers")}</label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="percentage_male_workers.value"
                onChange={formik.handleChange}
                value={formik.values.percentage_male_workers.value}
                error={formik.errors.percentage_male_workers}
              />
            </Table.Cell>
            <Table.Cell>
               <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("percentage_male_workers.isApproved", data.value)
                }
                value={formik.values.percentage_male_workers.isApproved}
                error={formik.errors.percentage_male_workers}
              />
              {/* {formik.values.percentage_male_workers.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("percentage_male_workers"),
                    "percentage_male_workers"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"percentage_male_workers"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.percentage_total_female.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">{convertSiteFieldsEngToEsp("percentage_total_female")}</label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="percentage_total_female.value"
                onChange={formik.handleChange}
                value={formik.values.percentage_total_female.value}
                error={formik.errors.percentage_total_female}
              />
            </Table.Cell>
            <Table.Cell>
               <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("percentage_total_female.isApproved", data.value)
                }
                value={formik.values.percentage_total_female.isApproved}
                error={formik.errors.percentage_total_female}
              />
              {/* {formik.values.percentage_total_female.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("percentage_total_female"),
                    "percentage_total_female"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"percentage_total_female"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.percentage_total_male.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">{convertSiteFieldsEngToEsp("percentage_total_male")}</label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="percentage_total_male.value"
                onChange={formik.handleChange}
                value={formik.values.percentage_total_male.value}
                error={formik.errors.percentage_total_male}
              />
            </Table.Cell>
            <Table.Cell>
                    <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("percentage_total_male.isApproved", data.value)
                }
                value={formik.values.percentage_total_male.isApproved}
                error={formik.errors.percentage_total_male}
              />
              {/* {formik.values.percentage_total_male.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("percentage_total_male"),
                    "percentage_total_male"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"percentage_total_male"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.percentage_female_leadership_positions.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                {convertSiteFieldsEngToEsp("percentage_female_leadership_positions")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="percentage_female_leadership_positions.value"
                onChange={formik.handleChange}
                value={
                  formik.values.percentage_female_leadership_positions.value
                }
                error={formik.errors.percentage_female_leadership_positions}
              />
            </Table.Cell>
            <Table.Cell>
                         <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("percentage_female_leadership_positions.isApproved", data.value)
                }
                value={formik.values.percentage_female_leadership_positions.isApproved}
                error={formik.errors.percentage_female_leadership_positions}
              />
              {/* {formik.values.percentage_female_leadership_positions.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("percentage_female_leadership_positions"),
                    "percentage_female_leadership_positions"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"percentage_female_leadership_positions"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.percentage_male_leadership_positions.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
                % de masculinos en posicion de liderazgo
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="percentage_male_leadership_positions.value"
                onChange={formik.handleChange}
                value={formik.values.percentage_male_leadership_positions.value}
                error={formik.errors.percentage_male_leadership_positions}
              />
            </Table.Cell>
            <Table.Cell>
                             <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("percentage_male_leadership_positions.isApproved", data.value)
                }
                value={formik.values.percentage_male_leadership_positions.isApproved}
                error={formik.errors.percentage_male_leadership_positions}
              />
              {/* {formik.values.percentage_male_leadership_positions.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    "% de masculinos en posicion de liderazgo",
                    "percentage_male_leadership_positions"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"percentage_male_leadership_positions"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.work_accidents_with_sick_days.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
              {convertSiteFieldsEngToEsp("work_accidents_with_sick_days")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="work_accidents_with_sick_days.value"
                onChange={formik.handleChange}
                value={formik.values.work_accidents_with_sick_days.value}
                error={formik.errors.work_accidents_with_sick_days}
              />
            </Table.Cell>
            <Table.Cell>
                            <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("work_accidents_with_sick_days.isApproved", data.value)
                }
                value={formik.values.work_accidents_with_sick_days.isApproved}
                error={formik.errors.work_accidents_with_sick_days}
              />
              {/* {formik.values.work_accidents_with_sick_days.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("work_accidents_with_sick_days"),
                    "work_accidents_with_sick_days"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"work_accidents_with_sick_days"}/>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
          <Table.Cell> <label className="label">
                {formik.values.first_aid_without_sick_days.code}{" "}
              </label></Table.Cell>
            <Table.Cell>
              <label className="label">
              {convertSiteFieldsEngToEsp("first_aid_without_sick_days")}
              </label>
            </Table.Cell>
            <Table.Cell>
              <Form.Input
                type="number"
                name="first_aid_without_sick_days.value"
                onChange={formik.handleChange}
                value={formik.values.first_aid_without_sick_days.value}
                error={formik.errors.first_aid_without_sick_days}
              />
            </Table.Cell>
            <Table.Cell>
                        <Form.Dropdown
                placeholder="Seleccione"
                options={[{key:1, value:true,name:"Aprobado"}, {key:2 , value:false,name:"No aprobado"}].map((ds) => {
                  return {
                    key: ds.key,
                    text: ds.name,
                    value: ds.value,
                  };
                })}
                selection
                onChange={(_, data) =>
                  formik.setFieldValue("first_aid_without_sick_days.isApproved", data.value)
                }
                value={formik.values.first_aid_without_sick_days.isApproved}
                error={formik.errors.first_aid_without_sick_days}
              />
              {/* {formik.values.first_aid_without_sick_days.isApproved?  <Icon color="green" name='checkmark' /> : <Icon color="red" name='close' />} */}
            </Table.Cell>
            <Table.Cell>
              <Button
                icon
                type="button"
                primary
                onClick={() => {
                  openUpdateSite(
                    convertSiteFieldsEngToEsp("first_aid_without_sick_days"),
                    "first_aid_without_sick_days"
                  );
                }}
              >
                <Icon name="comment outline" />
              </Button>
              <FileUpload accessToken={accessToken} data={formik} field={"first_aid_without_sick_days"}/>
            </Table.Cell>
          </Table.Row>
        </Table.Body>

        {/* <TableFooter fullWidth>
      <TableRow>
        <TableHeaderCell />
        <TableHeaderCell colSpan='4'>
          <Button
            floated='right'
            labelPosition='left'
            secundary
            size='small'
          > Aprobar todos
          </Button>
        </TableHeaderCell>
      </TableRow>
    </TableFooter> */}

      </Table>

      <BasicModal show={showModal} close={onOpenCloseModal} title={titleModal}>
        <Comments
          formik={formik}
          fieldName={fieldName}
          onClose={onOpenCloseModal}
          onReload={onReload}
          siteForm={siteForm}
          user={user}
        />
      </BasicModal>
      <Form.Group widths="2">
        <Form.Button type="submit" fluid primary loading={formik.isSubmitting}>
          {!siteForm ? "Guardar" : "Actualizar datos"}
        </Form.Button>
        <Form.Button
          type="button"
          color="red"
          secondary
          fluid
          onClick={() => {
            onClose ? onClose() : goBack();
          }}
        >
          {"Cancelar"}
        </Form.Button>
      </Form.Group>
    </Form>
  );
}

function Comments(props) {
  const { formik, user, fieldName, onClose } = props;
  const [comment, setComment] = useState("");
  console.log(user);

  const onChangeHandle = () => {
    if (comment && comment.length > 0) {
      let data = formik.values[fieldName].reviews;
      data.push({
        comment: comment,
        date: new Date(),
        reviewer_user: user ? user._id : null,
      });
      formik.setFieldValue(`${fieldName}.reviews`, data);
    }
    onClose();
  };

  const handleSaveComment = (id, editedContent) => {
    let data = formik.values[fieldName].reviews;
    data[id].comment = editedContent;
    data[id].date = new Date();
    formik.setFieldValue(`${fieldName}.reviews`, data);
  };

  return (
    <>
      <CommentGroup minimal>
        {formik.values[fieldName].reviews &&
        formik.values[fieldName].reviews.length > 0
          ? formik.values[fieldName].reviews.map((review, index) => (
              <>
                <EditableComment
                  id={index}
                  author={
                    review.reviewer_user
                      ? review.reviewer_user === user._id
                        ? user.firstname + " " + user.lastname
                        : review.reviewer_user.firstname +
                          " " +
                          review.reviewer_user.lastname
                      : ""
                  }
                  date={formatDateHourCompleted(review.date)}
                  content={review.comment}
                  onSave={handleSaveComment}
                  active={
                    review.reviewer_user
                      ? review.reviewer_user === user._id
                        ? true
                        : false
                      : false
                  }
                />
                <Divider fitted />
              </>
            ))
          : null}
        <Form.TextArea
          //  name={[fieldName].reviews.comments}
          placeholder=""
          rows={3}
          style={{ minHeight: 100, width: "100%" }}
          // onChange={formik.handleChange}
          onChange={(_, data) => setComment(data.value)}
          value={formik.values[fieldName].reviews.comments}
          error={formik.errors[fieldName]}
        />
        <Form.Button
          type="button"
          icon="edit"
          content={"Añadir comentario"}
          primary
          fluid
          onClick={onChangeHandle}
        ></Form.Button>
      </CommentGroup>
    </>
  );
}

const EditableComment = ({ id, author, date, content, onSave, active }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(id, editedContent); // Save edited content
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset edited content and toggle editing off
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setEditedContent(e.target.value);
  };

  return (
    <Comment>
      <Comment.Content>
        <Comment.Author>{author}</Comment.Author>
        <CommentMetadata>
          <div>{date}</div>
        </CommentMetadata>
        <Comment.Text>
          {isEditing ? (
            <Form reply>
              <Form.TextArea value={editedContent} onChange={handleChange} />
              <Button content="Guardar" onClick={handleSave} primary />
              <Button content="Cancelar" onClick={handleCancel} secondary />
            </Form>
          ) : (
            <div>{editedContent}</div>
          )}
        </Comment.Text>
        {active ? (
          <Comment.Actions>
            <Comment.Action onClick={handleEdit}>Editar</Comment.Action>
          </Comment.Actions>
        ) : null}
      </Comment.Content>
    </Comment>
  );
};

function FileUpload (props) {
  const {accessToken, data, field}=props;
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [message, setMessage] = useState('');

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf',  
    //'application/vnd.ms-excel', // .xls
    //'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];

  useEffect(() => {
    if (data.values[field] && data.values[field].file!==null) {
     setFileName(data.values[field].file);
    }
  }, [field]);

   const handleFileChange = async (event) => {
    const file = event.target.files[0];
    
    if (file) {
      if (!allowedTypes.includes(file.type)) {
        console.log('Tipo de archivo no permitido. Debe ser JPG, PNG o PDF.');
      } else {
      setMessage(`Archivo seleccionado: ${file.name}`);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await siteFormController.uploadFileApi(accessToken,formData);
        setMessage(response.msg);
        if(response.status && response.status===200){
          setFile(file);
          setFileName(file.name);
          data.setFieldValue(`${field}.file`, file.name)
        }
      } catch (error) {
        setMessage('Error al subir el archivo');
      }
    }
    }
  };

  const handleButtonClick = (event) => {
    event.preventDefault(); // Evita que el formulario se envíe
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = handleFileChange;
    input.click();
  };

  const handleRemoveFile = async () => {
    setFile(null); // Elimina el archivo
    setFileName(null);
    try {
      const response = await siteFormController.deleteFileApi(accessToken,fileName);
      setMessage(response.message);
      removeFile();
    } catch (error) {
      setMessage('Error al elimianr el archivo');
    }
  };

  const removeFile = async () => {
    data.setFieldValue(`${field}.file`, null)
  };

  return (
    <>
     
      {fileName? (
        <>
          {/* <p>{file.name}</p> */}
          <FileViewer fileName={fileName} handleRemove={handleRemoveFile}/>
        </>
      ):  <Button icon onClick={handleButtonClick}>
                   <Icon name="paperclip" />
    </Button>}
    </>
  );

};

function FileViewer (props){
  const {fileName, handleRemove}=props;
  const [fileUrl, setFileUrl] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (fileName) {
      setFileUrl(fileName); // Construye la URL del archivo
      (async () => {
        try {
          const response = await siteFormController.getFileApi(fileName);
          setFileUrl(response); // Construye la URL del archivo
          //setMessage(response.message);
        } catch (error) {
          //setMessage('Error al elimianr el archivo');
        }
          })();
    
    }
  }, [fileName]);

  const handleOpenPreview = (event) => {
    event.preventDefault(); 
    setPreviewOpen(true);
  };

  const handleClosePreview = (event) => {
    event.preventDefault(); // Previene el comportamiento predeterminado
    setPreviewOpen(false);
  };
  console.log(fileUrl)

  return (
    <>
      {/* //<Button onClick={handleOpenPreview}> {fileName}</Button> */}
       
    <Modal
      onClose={ handleClosePreview}
      onOpen={handleOpenPreview}
      open={previewOpen}
      trigger={<Button primary icon><Icon name="file alternate"/></Button>}
    >
      <ModalHeader>{fileName}</ModalHeader>
      <ModalContent>
        {fileName && (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg')) && (
            <Image src={fileUrl} alt="Vista previa" style={{ maxWidth: '100%' }} />
          )}
          {fileName && fileName.endsWith('.pdf') && (
            <iframe src={fileUrl} title="Vista previa" style={{ width: '100%', height: '500px' }} />
          )}
      </ModalContent>
      <ModalActions>
      <Button color="red" onClick={handleRemove}>
          <Icon disabled name='trash alternate' /> Eliminar
          </Button>
        <Button color='black' onClick={handleClosePreview}>
        <Icon disabled name='close' />Cerrar
        </Button>
      </ModalActions>
    </Modal>
    </>
  );
};