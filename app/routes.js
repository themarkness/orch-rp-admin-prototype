//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const crypto = require('crypto')

// Add your routes here

// Utility function to generate UUID v4
function generateUUID() {
	return crypto.randomUUID()
}

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

// Services page - list all user's services
router.get('/services', function (req, res) {
	// Initialize services storage if not present
	if (!req.session.userServices) {
		req.session.userServices = {}
	}

	// Create services array with links for template
	const services = Object.entries(req.session.userServices).map(([uid, service]) => ({
		uid: uid,
		name: service.name,
		link: `/services/${uid}`
	}))

	res.render('services', { services: services })
})

// Add new service page
router.get('/services/add-new-service', function (req, res) {
	res.render('services/add-new-service')
})

// Handle add new service form submission
router.post('/services/add-new-service', function (req, res) {
	const serviceName = req.body['service-name']
	
	if (!serviceName) {
		return res.render('services/add-new-service', {
			errors: ['Service name is required']
		})
	}

	// Initialize session data for services if not present
	if (!req.session.userServices) {
		req.session.userServices = {}
	}

	const serviceUid = generateUUID()

	// Create new service with sensible defaults
	const newService = {
		uid: serviceUid,
		name: serviceName,
		created: new Date().toISOString(),
		// Integration config (editable)
		integration: {
			name: serviceName + ' (integration)',
			clientId: 'client-id-' + serviceUid.substr(0, 13),
			contacts: '',
			redirectUris: [],
			postLogoutRedirectUris: [],
			sectorIdentifierUri: '',
			maxAgeEnabled: false,
			landingPageUri: '',
			scopes: ['openid', 'email'], // Default scopes
			proveUsersIdentities: false,
			enforcePKCE: true, // Security best practice
			authMethod: 'private_key_jwt', // Secure default
			publicKey: '',
			idTokenAlg: 'ES256'
		},
		// Production config (read-only in UI, but stored for reference)
		production: {
			name: serviceName + ' (production)',
			clientId: 'client-id-prod-' + serviceUid.substr(0, 8),
			contacts: '',
			redirectUris: [],
			postLogoutRedirectUris: [],
			sectorIdentifierUri: '',
			maxAgeEnabled: false,
			landingPageUri: '',
			scopes: ['openid', 'email'],
			proveUsersIdentities: false,
			enforcePKCE: true,
			authMethod: 'private_key_jwt',
			publicKey: '',
			idTokenAlg: 'ES256'
		},
		// Go-live checklist
		goLiveChecklist: {
			integrationComplete: false,
			redirectUrls: false,
			scopes: false,
			teamMember: false,
			agreement: false
		}
	}

	req.session.userServices[serviceUid] = newService

	res.redirect(`/services/${serviceUid}`)
})

// Get single service - redirect to dashboard
router.get('/services/:uid', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	res.redirect(`/services/${uid}/dashboard`)
})

// Service dashboard
router.get('/services/:uid/dashboard', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	res.render('analytics-dashboard', { serviceName: service.name })
})

// Service client configuration
router.get('/services/:uid/client-configuration', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	const integration = service.integration
	const production = service.production

	res.render('client-configuration', {
		integration: integration,
		production: production,
		saved: !!req.query.saved,
		serviceName: service.name,
		serviceUid: uid
	})
})

// Change a field in service client configuration
router.get('/services/:uid/client-configuration/change/:field', function (req, res) {
	const uid = req.params.uid
	const field = req.params.field

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	const integration = service.integration

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
		return res.redirect(`/services/${uid}/client-configuration`)
	}

	let value = integration[field]
	if (Array.isArray(value)) {
		if (field === 'redirectUris' || field === 'postLogoutRedirectUris') {
			value = value.join('\n')
		} else {
			value = value.join(', ')
		}
	}

	res.render('clients-change', {
		field: field,
		fieldLabel: cfg.label,
		fieldType: cfg.type,
		value: value,
		serviceUid: uid
	})
})

router.post('/services/:uid/client-configuration/change/:field', function (req, res) {
	const uid = req.params.uid
	const field = req.params.field
	const body = req.body || {}

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	const integration = service.integration

	let newValue = body.value || ''
	if (field === 'redirectUris' || field === 'postLogoutRedirectUris') {
		integration[field] = newValue.split('\n').map(s => s.trim()).filter(Boolean)
	} else if (field === 'scopes') {
		integration[field] = newValue.split(',').map(s => s.trim()).filter(Boolean)
	} else {
		integration[field] = newValue
	}

	res.redirect(`/services/${uid}/client-configuration?saved=true`)
})

// Team members page for specific service
router.get('/services/:uid/team-members', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	res.render('team-members', { serviceName: service.name, serviceUid: uid })
})

// Backward compatibility - redirect old routes to first service if it exists
router.get('/client-configuration', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		// Create a default service for backward compatibility
		const serviceUid = generateUUID()
		if (!req.session.userServices) {
			req.session.userServices = {}
		}

		req.session.userServices[serviceUid] = {
			uid: serviceUid,
			name: "Default Service",
			created: new Date().toISOString(),
			integration: {
				name: "Default Service (integration)",
				clientId: 'default-client-id',
				contacts: '',
				redirectUris: [],
				postLogoutRedirectUris: [],
				sectorIdentifierUri: '',
				maxAgeEnabled: false,
				landingPageUri: '',
				scopes: ['openid', 'email'],
				proveUsersIdentities: false,
				enforcePKCE: true,
				authMethod: 'private_key_jwt',
				publicKey: '',
				idTokenAlg: 'ES256'
			},
			production: {
				name: "Default Service (production)",
				clientId: 'default-prod-client-id',
				contacts: '',
				redirectUris: [],
				postLogoutRedirectUris: [],
				sectorIdentifierUri: '',
				maxAgeEnabled: false,
				landingPageUri: '',
				scopes: ['openid', 'email'],
				proveUsersIdentities: false,
				enforcePKCE: true,
				authMethod: 'private_key_jwt',
				publicKey: '',
				idTokenAlg: 'ES256'
			},
			goLiveChecklist: {
				integrationComplete: false,
				redirectUrls: false,
				scopes: false,
				teamMember: false,
				agreement: false
			}
		}
	}

	// Get first service UID
	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/client-configuration`)
})

// Backward compatibility - old dashboard route
router.get('/dashboard', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/dashboard`)
})

// Go-live checklist page
router.get('/services/:uid/make-live', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]

	res.render('go-live-checklist', {
		serviceName: service.name,
		goLiveChecklist: service.goLiveChecklist,
		serviceUid: uid
	})
})

// Integration complete task
router.get('/services/:uid/make-live/integration-complete', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	res.render('make-live-integration-complete', {
		serviceName: service.name,
		goLiveChecklist: service.goLiveChecklist,
		serviceUid: uid
	})
})

router.post('/services/:uid/make-live/integration-complete', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	service.goLiveChecklist.integrationComplete = req.body.integrationComplete === 'yes'
	res.redirect(`/services/${uid}/make-live`)
})

// Redirect URLs task
router.get('/services/:uid/make-live/redirect-urls', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	const production = service.production

	res.render('make-live-redirect-urls', {
		serviceName: service.name,
		redirectUrls: (production.redirectUris || []).join('\n'),
		postLogoutRedirectUrls: (production.postLogoutRedirectUris || []).join('\n'),
		serviceUid: uid
	})
})

router.post('/services/:uid/make-live/redirect-urls', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	const production = service.production

	const redirectUrls = (req.body.redirectUrls || '').split('\n').map(s => s.trim()).filter(Boolean)
	const postLogoutRedirectUrls = (req.body.postLogoutRedirectUrls || '').split('\n').map(s => s.trim()).filter(Boolean)

	production.redirectUris = redirectUrls
	production.postLogoutRedirectUris = postLogoutRedirectUrls

	// Mark as complete if at least one redirect URL is provided
	service.goLiveChecklist.redirectUrls = redirectUrls.length > 0

	res.redirect(`/services/${uid}/make-live`)
})

// Scopes task
router.get('/services/:uid/make-live/scopes', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	const production = service.production

	res.render('make-live-scopes', {
		serviceName: service.name,
		scopes: production.scopes || [],
		serviceUid: uid
	})
})

router.post('/services/:uid/make-live/scopes', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	const production = service.production

	let scopes = ['openid'] // openid is always included

	if (req.body.scopes) {
		// Handle both single value and array
		const selectedScopes = Array.isArray(req.body.scopes) ? req.body.scopes : [req.body.scopes]
		scopes = scopes.concat(selectedScopes)
	}

	production.scopes = scopes
	service.goLiveChecklist.scopes = true

	res.redirect(`/services/${uid}/make-live`)
})

// Team member task
router.get('/services/:uid/make-live/team-member', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	res.render('make-live-team-member', {
		serviceName: service.name,
		goLiveChecklist: service.goLiveChecklist,
		serviceUid: uid
	})
})

router.post('/services/:uid/make-live/team-member', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	service.goLiveChecklist.teamMember = req.body.teamMember === 'yes'
	res.redirect(`/services/${uid}/make-live`)
})

// Agreement task
router.get('/services/:uid/make-live/agreement', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	res.render('make-live-agreement', {
		serviceName: service.name,
		goLiveChecklist: service.goLiveChecklist,
		serviceUid: uid
	})
})

router.post('/services/:uid/make-live/agreement', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	service.goLiveChecklist.agreement = req.body.agreement === 'accepted'
	res.redirect(`/services/${uid}/make-live`)
})

// Send request to go live
router.get('/services/:uid/make-live/request', function (req, res) {
	const uid = req.params.uid

	if (!req.session.userServices || !req.session.userServices[uid]) {
		return res.status(404).render('error', { message: 'Service not found' })
	}

	const service = req.session.userServices[uid]
	res.render('make-live-request', {
		serviceName: service.name,
		serviceUid: uid
	})
})

// Backward compatibility routes for old /client-configuration/change paths
router.get('/client-configuration/change/:field', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		// Create a default service
		const serviceUid = generateUUID()
		if (!req.session.userServices) {
			req.session.userServices = {}
		}

		req.session.userServices[serviceUid] = {
			uid: serviceUid,
			name: "Default Service",
			created: new Date().toISOString(),
			integration: {
				name: "Default Service (integration)",
				clientId: 'default-client-id',
				contacts: '',
				redirectUris: [],
				postLogoutRedirectUris: [],
				sectorIdentifierUri: '',
				maxAgeEnabled: false,
				landingPageUri: '',
				scopes: ['openid', 'email'],
				proveUsersIdentities: false,
				enforcePKCE: true,
				authMethod: 'private_key_jwt',
				publicKey: '',
				idTokenAlg: 'ES256'
			},
			production: {
				name: "Default Service (production)",
				clientId: 'default-prod-client-id',
				contacts: '',
				redirectUris: [],
				postLogoutRedirectUris: [],
				sectorIdentifierUri: '',
				maxAgeEnabled: false,
				landingPageUri: '',
				scopes: ['openid', 'email'],
				proveUsersIdentities: false,
				enforcePKCE: true,
				authMethod: 'private_key_jwt',
				publicKey: '',
				idTokenAlg: 'ES256'
			},
			goLiveChecklist: {
				integrationComplete: false,
				redirectUrls: false,
				scopes: false,
				teamMember: false,
				agreement: false
			}
		}
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/client-configuration/change/${req.params.field}`)
})

router.post('/client-configuration/change/:field', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/client-configuration/change/${req.params.field}`)
})

// Backward compatibility for old make-live routes
router.get('/make-live', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live`)
})

router.get('/make-live/integration-complete', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/integration-complete`)
})

router.post('/make-live/integration-complete', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/integration-complete`)
})

router.get('/make-live/redirect-urls', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/redirect-urls`)
})

router.post('/make-live/redirect-urls', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/redirect-urls`)
})

router.get('/make-live/scopes', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/scopes`)
})

router.post('/make-live/scopes', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/scopes`)
})

router.get('/make-live/team-member', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/team-member`)
})

router.post('/make-live/team-member', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/team-member`)
})

router.get('/make-live/agreement', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/agreement`)
})

router.post('/make-live/agreement', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/agreement`)
})

router.get('/make-live/request', function (req, res) {
	if (!req.session.userServices || Object.keys(req.session.userServices).length === 0) {
		return res.redirect('/services')
	}

	const firstUid = Object.keys(req.session.userServices)[0]
	res.redirect(`/services/${firstUid}/make-live/request`)
})
