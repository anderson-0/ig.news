import { query as q } from "faunadb";
import { fauna } from "../../../services/fauna";
import { stripe } from "../../../services/stripe";

export async function saveSubscription(
    subscriptionId: string, 
    customerId: string,
    createAction = false
) {
    // Find the user in FaunaDB using customerId (stripe customer ID)
    const userRef = await fauna.query(
        q.Select(
            "ref",
            q.Get(
                q.Match(
                    q.Index(process.env.INDEX_USER_BY_STRIPE_CUSTOMER_ID),
                    customerId
                )
            )
        )
    )

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionData = {
        id: subscription.id,
        userId: userRef,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id
    }
    // Save user subscription data in FaunaDB
    if (createAction) {
        await fauna.query(
            q.Create(
                q.Collection('subscriptions'),
                { data: subscriptionData }
            )
        )
    } else {
        await fauna.query(
            q.Replace(
                q.Select(
                    "ref",
                    q.Get(
                        q.Match(
                            q.Index(process.env.INDEX_SUBSCRIPTION_BY_ID),
                            subscription.id
                        )
                    )
                ),
                { data: subscriptionData }
            )
        )
    }
    
}