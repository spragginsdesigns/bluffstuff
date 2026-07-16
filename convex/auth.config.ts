// Clerk ↔ Convex JWT auth. The issuer domain comes from the Convex
// deployment env (`npx convex env set CLERK_JWT_ISSUER_DOMAIN ... [--prod]`)
// and must match the Clerk instance's Frontend API domain. Requires a JWT
// template named "convex" in the Clerk dashboard.
export default {
	providers: [
		{
			domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
			applicationID: "convex"
		}
	]
};
