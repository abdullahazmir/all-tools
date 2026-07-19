import Stripe from "stripe";
import { env } from "./env";

export const stripe = new Stripe(env.stripeSecretKey);

export const SELLER_FEE_AMOUNT_CENTS = 4900; // $49.00 one-time registration fee
