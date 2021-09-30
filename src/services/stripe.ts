import Stripe from 'stripe';

export const stripe = new Stripe(
    process.env.STRIPE_API_SECRET,
    {
        apiVersion: '2020-08-27',
        appInfo: {
            name: 'IG News',
            version: '0.1.0'
        }
    }
)