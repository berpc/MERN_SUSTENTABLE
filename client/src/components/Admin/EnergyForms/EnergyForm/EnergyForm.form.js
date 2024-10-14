import * as Yup from "yup";
import { energyCodes } from "../../../../utils/codes";

export function initialValues(energy, period, year) {
  return {
    date: energy?.date || "",
    creator_user: energy?.creator_user || "",
    state: energy?.state || "",
    period:energy?.period || period,
    year:energy?.year || year,
    electricity:energy?.electricity || {
      electricity_standard: energy?.electricity_standard || {
        code:energyCodes["electricity_standard"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      electricity_cost: energy?.electricity_cost || {
        code:energyCodes["electricity_cost"],
        unit:"",
        value:"",
        reviews:[
        ]
      },
      renewable_energies:energy?.renewable_energies || {
        code:energyCodes["renewable_energies"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      renewable_energies_produced_and_consumed_on_site:energy?.renewable_energies_produced_and_consumed_on_site || {
        code:energyCodes["renewable_energies_produced_and_consumed_on_site"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },     
    },
    fuels:energy?.fuels || {
      steam:energy?.steam || {
        code:energyCodes["steam"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      steam_cost:energy?.steam_cost || {
        code:energyCodes["steam_cost"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      natural_gas:energy?.natural_gas || {
        code:energyCodes["natural_gas"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      natural_gas_cost:energy?.natural_gas_cost || {
        code:energyCodes["natural_gas_cost"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      glp:energy?.glp || {
        code:energyCodes["glp"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      glp_cost:energy?.glp_cost || {
        code:energyCodes["glp_cost"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      heavy_fuel_oil:energy?.natural_gas || {
        code:energyCodes["natural_gas"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      cost_of_heavy_fuel_oil:energy?.natural_gas_cost || {
        code:energyCodes["natural_gas_cost"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      light_fuel_oil:energy?.light_fuel_oil || {
        code:energyCodes["light_fuel_oil"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      cost_of_light_fuel_oil:energy?.cost_of_light_fuel_oil || {
        code:energyCodes["cost_of_light_fuel_oil"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      coal:energy?.coal || {
        code:energyCodes["coal"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      coal_cost:energy?.coal_cost || {
        code:energyCodes["coal_cost"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      diesel:energy?.diesel || {
        code:energyCodes["diesel"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      diesel_cost:energy?.diesel_cost || {
        code:energyCodes["diesel_cost"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      gasoline_for_internal_vehicles:energy?.gasoline_for_internal_vehicles || {
        code:energyCodes["gasoline_for_internal_vehicles"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      gasoline_cost_of_internal_vehicles:energy?.gasoline_cost_of_internal_vehicles || {
        code:energyCodes["electricity_gasoline_cost_of_internal_vehiclesstandard"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      biomass:energy?.biomass || {
        code:energyCodes["biomass"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
      biomass_cost:energy?.biomass_cost || {
        code:energyCodes["biomass_cost"],
        unit:"",
        value:"",
        reviews:[
        ],
        isApproved:false
      },
    }

  };
}

export function validationSchema() {
  // return Yup.object({
  //   date: Yup.string().required(true),
  //   creator_user: Yup.string().required(true),
  //   state: Yup.string().required(true),
  //   installation_type: Yup.object({
  //     value: Yup.string().required(),
  //   }),
  // });
}
