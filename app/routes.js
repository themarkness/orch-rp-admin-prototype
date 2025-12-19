//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here

// Production data is read-only and static for the prototype
const production = {
	name: "Mark's test service 2 (production)",
	clientId: 'FaBA4Vk2L4tLkLg6VkS6SnpcexUY',
	contacts: 'mark.williams@dsit.gov.uk',
	redirectUris: ['https://service.gov.uk/redirect'],
	postLogoutRedirectUris: ['https://service.gov.uk/logout'],
	sectorIdentifierUri: 'http://gov.uk',
	maxAgeEnabled: false,
	landingPageUri: 'https://service.gov.uk/',
	scopes: ['openid', 'email', 'phone'],
	proveUsersIdentities: false,
	enforcePKCE: false,
	authMethod: 'private_key_jwt',
	publicKey: '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----',
	idTokenAlg: 'ES256'
}

// Clients comparison: Integration (editable via 'Change' links) vs Production (read-only)
router.get('/client-configuration', function (req, res) {
	// Seed session-stored integration data if missing
	if (!req.session.integration) {
		req.session.integration = {
			name: "Mark's test service 2 (integration)",
			clientId: 'FaBA4Vk2L4tLkLg6VkS6SnpcexUY-integ',
			contacts: 'mark.williams2@dsit.gov.uk',
			redirectUris: ['http://localhost/redirect', 'http://localhost/callback'],
			postLogoutRedirectUris: [],
			sectorIdentifierUri: 'http://gov.uk',
			maxAgeEnabled: false,
			landingPageUri: '',
			scopes: ['openid', 'email', 'phone'],
			proveUsersIdentities: false,
			enforcePKCE: false,
			authMethod: 'private_key_jwt',
			publicKey: '',
			idTokenAlg: 'ES256'
		}
	}

	const serviceName = req.session.serviceName || req.session.integration.name

	res.render('client-configuration', { integration: req.session.integration, production: production, saved: !!req.query.saved, serviceName: serviceName })
})

// Page to edit a single integration field using the GDS 'Change' pattern
router.get('/client-configuration/change/:field', function (req, res) {
	const field = req.params.field
	const integration = req.session.integration || {}

	// Provide a label and input type per field
	const fieldConfig = {
		name: { label: 'Name', type: 'text' },
		clientId: { label: 'Client ID', type: 'text' },
		contacts: { label: 'Contacts', type: 'text' },
		redirectUris: { label: 'Redirect URIs (one per line)', type: 'textarea' },
		postLogoutRedirectUris: { label: 'Post logout redirect URIs (one per line)', type: 'textarea' },
		scopes: { label: 'Scopes (comma separated)', type: 'text' },
		authMethod: { label: 'Authentication method', type: 'text' },
		idTokenAlg: { label: 'ID token signing algorithm', type: 'text' },
		publicKey: { label: 'Public key', type: 'textarea' }
	}

	const cfg = fieldConfig[field]
	if (!cfg) {
		return res.redirect('/client-configuration')
	}

	let value = integration[field]
	if (Array.isArray(value)) {
		if (field === 'redirectUris' || field === 'postLogoutRedirectUris') {
			value = value.join('\n')
		} else {
			value = value.join(', ')
		}
	}

	res.render('clients-change', { field: field, fieldLabel: cfg.label, fieldType: cfg.type, value: value })
})

router.post('/client-configuration/change/:field', function (req, res) {
	const field = req.params.field
	const body = req.body || {}
	const integration = req.session.integration || {}

	let newValue = body.value || ''
	if (field === 'redirectUris' || field === 'postLogoutRedirectUris') {
		integration[field] = newValue.split('\n').map(s => s.trim()).filter(Boolean)
	} else if (field === 'scopes') {
		integration[field] = newValue.split(',').map(s => s.trim()).filter(Boolean)
	} else {
		integration[field] = newValue
	}

	req.session.integration = integration

	if (field === 'name') {
		req.session.serviceName = newValue
	}

	res.redirect('/client-configuration?saved=1')
})

// Settings page
router.get('/settings', function (req, res) {
	// Seed session-stored integration data if missing
	if (!req.session.integration) {
		req.session.integration = {
			name: "Mark's test service 2 (integration)",
			clientId: 'FaBA4Vk2L4tLkLg6VkS6SnpcexUY-integ',
			contacts: 'mark.williams2@dsit.gov.uk',
			redirectUris: ['http://localhost/redirect', 'http://localhost/callback'],
			postLogoutRedirectUris: [],
			sectorIdentifierUri: 'http://gov.uk',
			maxAgeEnabled: false,
			landingPageUri: '',
			scopes: ['openid', 'email', 'phone'],
			proveUsersIdentities: false,
			enforcePKCE: false,
			authMethod: 'private_key_jwt',
			publicKey: '',
			idTokenAlg: 'ES256'
		}
	}

	const serviceName = req.session.serviceName || req.session.integration.name
	res.render('settings', { integration: req.session.integration, production: production, saved: !!req.query.saved, serviceName: serviceName })
})

// Your account page
router.get('/your-account', function (req, res) {
	res.render('your-account')
})

// Sign out
router.get('/sign-out', function (req, res) {
	req.session.destroy(function(err) {
		res.redirect('/')
	})
})

// Services page
router.get('/services', function (req, res) {
	const services = [
		{
			name: "Mark's test service 2",
			link: "/settings"
		}
	]
	res.render('services', { services: services })
})

// Team members page
router.get('/team-members', function (req, res) {
	res.render('team-members')
})
