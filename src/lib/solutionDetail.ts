/** Editorial solution copy based on Simulcast's published service catalog.
 * Capabilities describe scope, not product performance or proof of installations. */
export const solutionsDetails:Record<string,{category:string;lede:string;stages:{title:string;body:string}[];capabilities:string[];contexts:string[];cta:string}>={
  "broadcast-media":{
    category:"BROADCAST SYSTEMS & WORKFLOWS",lede:"Connect studio, head-end and delivery operations through carefully designed signal paths, compatible systems and practical handover.",
    stages:[{title:"Acquire & ingest",body:"Connect SDI/IP sources, studio feeds, contribution links, satellite receivers and media ingest points."},{title:"Produce & manage",body:"Plan playout scheduling, newsroom workflows, multiviewing, graphics generation and media asset management."},{title:"Encode & distribute",body:"Integrate DVB-C, DVB-S2, IPTV and OTT workflows with routing, encoding and downstream delivery."},{title:"Monitor & maintain",body:"Commission systems, document operations, hand over control and establish support/maintenance procedures."}],
    capabilities:["Broadcast head-end system design","DVB-C and DVB-S2 integration","IPTV / OTT workflow planning","Automated playout and scheduling","Character generation and on-air graphics","Media asset management and ingest","NRCS / newsroom operations","Multiviewer and video-wall solutions","Conditional access and subscriber systems","Equipment integration and technical support"],
    contexts:["Television stations","Head-end operators","IPTV & OTT providers","Live-event production"],cta:"Plan a broadcast workflow"
  },
  "software-platforms":{
    category:"APPLICATIONS & DIGITAL EXPERIENCE",lede:"Turn manual processes into coherent digital systems with interfaces tailored to the people who actually use them.",
    stages:[{title:"Discover users",body:"Define workflows, permissions, content models and measurable outcomes."},{title:"Design architecture",body:"Structure the database, API layer, application interfaces and system dependencies."},{title:"Build & integrate",body:"Implement dashboards, web applications, mobile-friendly interfaces and connected services."},{title:"Operate & evolve",body:"Deploy securely with documentation, backup planning and iterative support."}],
    capabilities:["Custom business applications","Responsive corporate websites","Administrative portals and CMS","ERP & CRM integrations","School and organization management","Operations dashboards","Secure backend APIs","Database design and reporting","Business workflow digitization","Application maintenance"],contexts:["Media companies","Service providers","Enterprises","Education and organizations"],cta:"Discuss a software project"
  },
  "ai-automation":{
    category:"WORKFLOW INTELLIGENCE & AUTOMATION",lede:"Apply automation where it removes repetitive effort and makes processes more reliable—with appropriate control and human review.",
    stages:[{title:"Map the process",body:"Understand approvals, bottlenecks, data inputs and exceptions."},{title:"Connect the tools",body:"Integrate APIs, databases, messaging tools and operational systems."},{title:"Design the controls",body:"Establish permissions, review steps, audit logs and failure handling."},{title:"Measure improvement",body:"Track task completion, exceptions and practical operational outcomes."}],
    capabilities:["Process automation","AI-assisted information workflows","Notifications and escalations","System-to-system orchestration","Data extraction and structured reporting","Operational alerting","Approvals and human-in-the-loop review","Workflow dashboards"],contexts:["Operations teams","Content teams","Customer service","Internal business systems"],cta:"Explore automation opportunities"
  },
  "it-infrastructure":{
    category:"IT SYSTEMS & NETWORK OPERATIONS",lede:"Build a dependable technical foundation for offices, media facilities, connected services and enterprise platforms.",
    stages:[{title:"Assess",body:"Review existing networks, servers, device inventory and availability expectations."},{title:"Architect",body:"Plan routing, segmentation, compute, storage and access controls around actual needs."},{title:"Deploy",body:"Install, configure, integrate and validate infrastructure."},{title:"Support",body:"Monitor, document and maintain systems for reliable operations."}],
    capabilities:["LAN / WAN network design","Switching and routing integration","Server and virtualization planning","Storage and backup architecture","Network monitoring","Connectivity and systems troubleshooting","Security-conscious access design","IT infrastructure maintenance"],contexts:["Office networks","Broadcast facilities","Service providers","Enterprise IT"],cta:"Review infrastructure needs"
  },
  "systems-integration":{
    category:"ENGINEERING & INTEROPERABILITY",lede:"Make systems from different vendors and teams communicate in one coherent operational workflow.",
    stages:[{title:"Map dependencies",body:"Review devices, interfaces, protocols, operating requirements and constraints."},{title:"Design interoperability",body:"Define signal flows, APIs, network policies and handover criteria."},{title:"Implement safely",body:"Integrate incrementally with validation and rollback considerations."},{title:"Handover",body:"Document the architecture and train operators to manage it."}],
    capabilities:["Vendor and platform integration","API integration and middleware","Broadcast-to-IP connectivity","Infrastructure interoperability","Operational monitoring integrations","Data and control-plane connectivity","Commissioning and system acceptance","Documentation and knowledge transfer"],contexts:["Complex media operations","Enterprises","Multi-vendor facilities","Hybrid infrastructure"],cta:"Talk about integration"
  },
  "technical-consulting":{
    category:"CONSULTING & LIFECYCLE SUPPORT",lede:"Get practical engineering guidance before, during and after deployment—with support built around the system's real operating needs.",
    stages:[{title:"Consult",body:"Identify priorities, constraints, risks and the right scope."},{title:"Specify",body:"Create a practical architecture and equipment/software plan."},{title:"Commission",body:"Support setup, testing, troubleshooting and operational readiness."},{title:"Maintain",body:"Plan AMC, support responses and upgrade paths."}],
    capabilities:["Technical discovery and audits","System specification","Solution architecture","Vendor coordination","Installation and commissioning support","Annual maintenance contracts (AMC)","Training and handover","Troubleshooting and upgrades"],contexts:["Broadcasters","Network operators","Organizations modernizing systems","Operational support teams"],cta:"Request engineering advice"
  }
};
