// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract DocumentRegistry is AccessControl {
    // Definizione dei ruoli
    bytes32 public constant CERTIFICATORE_ROLE = keccak256("CERTIFICATORE_ROLE");
    bytes32 public constant AUTORITA_ROLE     = keccak256("AUTORITA_ROLE");
    bytes32 public constant MANUTENTORE_ROLE   = keccak256("MANUTENTORE_ROLE");
    bytes32 public constant TITOLARE_ROLE      = keccak256("TITOLARE_ROLE");

    // Struttura del documento registrato
    struct Document {
        string cid;             // IPFS CID
        address owner;          // indirizzo del certificatore
        uint256 timestamp;      // data registrazione
        uint256 version;        // versione del documento
        string metadata;        // metadati JSON (es. tipo impianto)
    }

    mapping(bytes32 => Document) private documents;
    mapping(bytes32 => uint256) private versionCount;

    event DocumentRegistered(
        bytes32 indexed hash,
        string cid,
        address indexed owner,
        uint256 timestamp,
        uint256 version,
        string metadata
    );

    event RoleGrantedLog(address indexed account, string role);

    constructor() {
        // Ruolo admin iniziale → chi fa il deploy
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CERTIFICATORE_ROLE, msg.sender);
    }

    function registerDocument(bytes32 hash, string calldata cid, string calldata metadata)
        external onlyRole(CERTIFICATORE_ROLE)
    {
        require(bytes(documents[hash].cid).length == 0, "Document already registered");

        uint256 v = versionCount[hash] + 1;
        versionCount[hash] = v;

        documents[hash] = Document({
            cid: cid,
            owner: msg.sender,
            timestamp: block.timestamp,
            version: v,
            metadata: metadata
        });

        emit DocumentRegistered(hash, cid, msg.sender, block.timestamp, v, metadata);
    }
    modifier onlyPermittedViewer() {
        require(
            hasRole(CERTIFICATORE_ROLE, msg.sender) ||
            hasRole(AUTORITA_ROLE, msg.sender) ||
            hasRole(MANUTENTORE_ROLE, msg.sender) ||
            hasRole(TITOLARE_ROLE, msg.sender),
            "Access denied"
        );
        _;
    }

    function getDocument(bytes32 hash) 
        external view onlyPermittedViewer
        returns (
        string memory cid,
        address owner,
        uint256 timestamp,
        uint256 version,
        string memory metadata
    ) {
        require(bytes(documents[hash].cid).length != 0, "Document not found");

        Document memory doc = documents[hash];
        return (doc.cid, doc.owner, doc.timestamp, doc.version, doc.metadata);
    }

    // Utility: verifica se un wallet ha un ruolo
    function hasCertificatoreRole(address user) external view returns (bool) {
        return hasRole(CERTIFICATORE_ROLE, user);
    }

    // Utility: ruolo dinamico → per backend (string to hash)
    function hasRoleByString(string calldata roleName, address user) external view returns (bool) {
        return hasRole(keccak256(bytes(roleName)), user);
    }

    // Utility: solo admin può assegnare ruoli
    function grantUserRole(address user, string calldata roleName)
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        bytes32 role = keccak256(bytes(roleName));
        _grantRole(role, user);
        emit RoleGrantedLog(user, roleName);
    }
    
}
