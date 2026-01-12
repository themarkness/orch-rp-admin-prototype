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
			link: "/dashboard"
		}
	]
	res.render('services', { services: services })
})

// Dashboard
router.get('/dashboard', function (req, res) {
	const serviceName = req.session.serviceName || "Mark's test service 2"
	res.render('analytics-dashboard', { serviceName: serviceName })
})

// Team members page
router.get('/team-members', function (req, res) {
	res.render('team-members')
})

// Go-live checklist page
router.get('/make-live', function (req, res) {
	// Initialize go-live checklist in session if it doesn't exist
	if (!req.session.goLiveChecklist) {
		req.session.goLiveChecklist = {
			integrationComplete: false,
			redirectUrls: false,
			scopes: false,
			teamMember: false,
			agreement: false
		}
	}

	const serviceName = req.session.serviceName || "Mark's test service 2"
	res.render('go-live-checklist', {
		serviceName: serviceName,
		goLiveChecklist: req.session.goLiveChecklist
	})
})

// Integration complete task
router.get('/make-live/integration-complete', function (req, res) {
	const serviceName = req.session.serviceName || "Mark's test service 2"
	res.render('make-live-integration-complete', {
		serviceName: serviceName,
		goLiveChecklist: req.session.goLiveChecklist || {}
	})
})

router.post('/make-live/integration-complete', function (req, res) {
	if (!req.session.goLiveChecklist) {
		req.session.goLiveChecklist = {}
	}
	req.session.goLiveChecklist.integrationComplete = req.body.integrationComplete === 'yes'
	res.redirect('/make-live')
})

// Redirect URLs task
router.get('/make-live/redirect-urls', function (req, res) {
	const serviceName = req.session.serviceName || "Mark's test service 2"
	const production = req.session.production || {}

	res.render('make-live-redirect-urls', {
		serviceName: serviceName,
		redirectUrls: (production.redirectUrls || []).join('\n'),
		postLogoutRedirectUrls: (production.postLogoutRedirectUrls || []).join('\n')
	})
})

router.post('/make-live/redirect-urls', function (req, res) {
	if (!req.session.goLiveChecklist) {
		req.session.goLiveChecklist = {}
	}
	if (!req.session.production) {
		req.session.production = {}
	}

	const redirectUrls = (req.body.redirectUrls || '').split('\n').map(s => s.trim()).filter(Boolean)
	const postLogoutRedirectUrls = (req.body.postLogoutRedirectUrls || '').split('\n').map(s => s.trim()).filter(Boolean)

	req.session.production.redirectUrls = redirectUrls
	req.session.production.postLogoutRedirectUrls = postLogoutRedirectUrls

	// Mark as complete if at least one redirect URL is provided
	req.session.goLiveChecklist.redirectUrls = redirectUrls.length > 0

	res.redirect('/make-live')
})

// Scopes task
router.get('/make-live/scopes', function (req, res) {
	const serviceName = req.session.serviceName || "Mark's test service 2"
	const production = req.session.production || {}

	res.render('make-live-scopes', {
		serviceName: serviceName,
		scopes: production.scopes || []
	})
})

router.post('/make-live/scopes', function (req, res) {
	if (!req.session.goLiveChecklist) {
		req.session.goLiveChecklist = {}
	}
	if (!req.session.production) {
		req.session.production = {}
	}

	let scopes = ['openid'] // openid is always included

	if (req.body.scopes) {
		// Handle both single value and array
		const selectedScopes = Array.isArray(req.body.scopes) ? req.body.scopes : [req.body.scopes]
		scopes = scopes.concat(selectedScopes)
	}

	req.session.production.scopes = scopes
	req.session.goLiveChecklist.scopes = true

	res.redirect('/make-live')
})

// Team member task
router.get('/make-live/team-member', function (req, res) {
	const serviceName = req.session.serviceName || "Mark's test service 2"
	res.render('make-live-team-member', {
		serviceName: serviceName,
		goLiveChecklist: req.session.goLiveChecklist || {}
	})
})

router.post('/make-live/team-member', function (req, res) {
	if (!req.session.goLiveChecklist) {
		req.session.goLiveChecklist = {}
	}
	req.session.goLiveChecklist.teamMember = req.body.teamMember === 'yes'
	res.redirect('/make-live')
})

// Agreement task
router.get('/make-live/agreement', function (req, res) {
	const serviceName = req.session.serviceName || "Mark's test service 2"
	res.render('make-live-agreement', {
		serviceName: serviceName,
		goLiveChecklist: req.session.goLiveChecklist || {}
	})
})

router.post('/make-live/agreement', function (req, res) {
	if (!req.session.goLiveChecklist) {
		req.session.goLiveChecklist = {}
	}
	req.session.goLiveChecklist.agreement = req.body.agreement === 'accepted'
	res.redirect('/make-live')
})

// Send request to go live
router.get('/make-live/request', function (req, res) {
	const serviceName = req.session.serviceName || "Mark's test service 2"
	res.render('make-live-request', {
		serviceName: serviceName
	})
})
