export interface Product {
  amount: number;
  order: number;
  id?: string;
  desc?: string;
  color?: string;
  contract?: string;
  label?: string;
  memo?: string;
  name?: string;
  props?: Array<ProductProp>;
}

export interface ProductProp {
  enable: boolean;
  name: string;
}
