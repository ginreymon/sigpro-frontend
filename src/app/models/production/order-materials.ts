export interface OrderMaterial {
  materialNumber: number;
  fabricCode:     string;
  fabricColor:    string;
  consumption:    number;
  description:    string;
  total:          number;
}

export interface OrderMaterialSize {
  size:      string;
  skuRowId:  number;
  materials: OrderMaterial[];
}

export interface OrderMaterialColor {
  color: string;
  sizes: OrderMaterialSize[];
}

export interface OrderMaterialReference {
  reference: string;
  colors:    OrderMaterialColor[];
}

export interface OrderMaterialsResponse {
  op:         string;
  docType:    string;
  docNumber:  number;
  references: OrderMaterialReference[];
}
