import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { query as q} from 'faunadb';
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";

type User =  {
    ref: {
        id: string;
    },
    data: {
        stripe_customer_id: string;
    }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST') {

        // Retrieves user session data that is stored in a cookie in the browser.
        const userSession = await getSession({ req });

        const user = await fauna.query<User>(
            q.Get(
                q.Match(
                    q.Index('users_index_email'),
                    q.Casefold(userSession.user.email)
                )
            )
        )

        let customerId = user.data.stripe_customer_id;


        if (!customerId) {
            // Creates a customer record for the user inside stripe
            const stripeCustomer = await stripe.customers.create({
                email: userSession.user.email
            }); 

            await fauna.query(
                q.Update(
                    q.Ref(q.Collection('users'),user.ref.id),
                    {
                        data: {
                            stripe_customer_id: stripeCustomer.id
                        }
                    }
                )
            )
            customerId = stripeCustomer.id;
        }

        // Creates a stripe session for the provided user and product(s)
        const stripeCheckoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            line_items:[
                {
                    price: process.env.HOME_PAGE_PRODUCT_PRICE_ID,
                    quantity: 1
                }
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
            cancel_url: process.env.APP_URL ,
            success_url: `${process.env.APP_URL}/posts`
        })
        return res.status(200).json({sessionId: stripeCheckoutSession.id });
    }

    res.setHeader('Allow','POST');
    return res.status(405).end('Method not allowed');
}