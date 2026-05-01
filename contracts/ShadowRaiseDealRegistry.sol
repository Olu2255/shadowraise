// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Nox, euint256, externalEuint256} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {IERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984.sol";

/// @title ShadowRaiseDealRegistry
/// @notice Nox-aware deal registry for confidential founder metrics and public investor signals.
/// @dev Raw financial metrics are stored as Nox encrypted handles. Marketplace getters expose
/// only public risk and metadata fields that are safe for investors to browse.
contract ShadowRaiseDealRegistry {
    struct Deal {
        uint256 id;
        address founder;
        string companyName;
        string sector;
        uint256 fundingTarget;
        string publicMetadataURI;
        uint256 publicRiskScore;
        string publicRiskLevel;
        uint256 publicConfidenceScore;
        string revenueBand;
        string burnRiskBand;
        bool active;
        uint256 createdAt;
        euint256 monthlyRevenue;
        euint256 monthlyBurn;
        euint256 runwayMonths;
        euint256 grossMargin;
        euint256 customerCount;
        euint256 runwayHealthSignal;
        euint256 burnDisciplineSignal;
        euint256 tractionSignal;
    }

    struct PublicDeal {
        uint256 id;
        address founder;
        string companyName;
        string sector;
        uint256 fundingTarget;
        string publicMetadataURI;
        uint256 publicRiskScore;
        string publicRiskLevel;
        uint256 publicConfidenceScore;
        string revenueBand;
        string burnRiskBand;
        bool active;
        uint256 createdAt;
    }

    struct InvestmentIntent {
        uint256 id;
        uint256 dealId;
        address investor;
        euint256 encryptedAmount;
        uint256 createdAt;
    }

    address public immutable confidentialToken;

    uint256 private nextDealId = 1;
    uint256 private nextInvestmentId = 1;

    mapping(uint256 => Deal) private deals;
    mapping(uint256 => InvestmentIntent) private investmentIntents;
    mapping(address => uint256[]) private founderDealIds;
    mapping(address => uint256[]) private investorInvestmentIds;

    event DealCreated(
        uint256 indexed dealId,
        address indexed founder,
        string companyName,
        string sector,
        uint256 fundingTarget,
        uint256 publicRiskScore,
        string publicRiskLevel,
        uint256 publicConfidenceScore,
        string revenueBand,
        string burnRiskBand,
        string publicMetadataURI
    );

    event ConfidentialInvestmentIntentCreated(
        uint256 indexed investmentId,
        uint256 indexed dealId,
        address indexed investor,
        euint256 encryptedAmount
    );

    constructor(address confidentialToken_) {
        require(confidentialToken_ != address(0), "token required");
        confidentialToken = confidentialToken_;
    }

    function createDeal(
        string calldata companyName,
        string calldata sector,
        uint256 fundingTarget,
        string calldata publicMetadataURI,
        uint256 publicRiskScore,
        string calldata publicRiskLevel,
        uint256 publicConfidenceScore,
        string calldata revenueBand,
        string calldata burnRiskBand,
        externalEuint256 monthlyRevenue,
        bytes calldata monthlyRevenueProof,
        externalEuint256 monthlyBurn,
        bytes calldata monthlyBurnProof,
        externalEuint256 runwayMonths,
        bytes calldata runwayMonthsProof,
        externalEuint256 grossMargin,
        bytes calldata grossMarginProof,
        externalEuint256 customerCount,
        bytes calldata customerCountProof
    ) external returns (uint256 dealId) {
        require(bytes(companyName).length > 0, "company required");
        require(bytes(sector).length > 0, "sector required");
        require(publicRiskScore <= 100, "invalid risk score");
        require(publicConfidenceScore <= 100, "invalid confidence score");

        euint256 monthlyRevenueHandle = Nox.fromExternal(
            monthlyRevenue,
            monthlyRevenueProof
        );
        euint256 monthlyBurnHandle = Nox.fromExternal(monthlyBurn, monthlyBurnProof);
        euint256 runwayMonthsHandle = Nox.fromExternal(runwayMonths, runwayMonthsProof);
        euint256 grossMarginHandle = Nox.fromExternal(grossMargin, grossMarginProof);
        euint256 customerCountHandle = Nox.fromExternal(customerCount, customerCountProof);
        euint256 one = Nox.toEuint256(1);
        euint256 zero = Nox.toEuint256(0);
        euint256 runwayHealthSignal = Nox.select(
            Nox.ge(runwayMonthsHandle, Nox.toEuint256(6)),
            one,
            zero
        );
        euint256 burnDisciplineSignal = Nox.select(
            Nox.le(monthlyBurnHandle, monthlyRevenueHandle),
            one,
            zero
        );
        euint256 tractionSignal = Nox.select(
            Nox.ge(customerCountHandle, Nox.toEuint256(50)),
            one,
            zero
        );

        dealId = nextDealId++;
        Deal storage deal = deals[dealId];
        deal.id = dealId;
        deal.founder = msg.sender;
        deal.companyName = companyName;
        deal.sector = sector;
        deal.fundingTarget = fundingTarget;
        deal.publicMetadataURI = publicMetadataURI;
        deal.publicRiskScore = publicRiskScore;
        deal.publicRiskLevel = publicRiskLevel;
        deal.publicConfidenceScore = publicConfidenceScore;
        deal.revenueBand = revenueBand;
        deal.burnRiskBand = burnRiskBand;
        deal.active = true;
        deal.createdAt = block.timestamp;
        deal.monthlyRevenue = monthlyRevenueHandle;
        deal.monthlyBurn = monthlyBurnHandle;
        deal.runwayMonths = runwayMonthsHandle;
        deal.grossMargin = grossMarginHandle;
        deal.customerCount = customerCountHandle;
        deal.runwayHealthSignal = runwayHealthSignal;
        deal.burnDisciplineSignal = burnDisciplineSignal;
        deal.tractionSignal = tractionSignal;

        _allowDealFinancialHandles(deal, msg.sender);
        founderDealIds[msg.sender].push(dealId);

        emit DealCreated(
            dealId,
            msg.sender,
            companyName,
            sector,
            fundingTarget,
            publicRiskScore,
            publicRiskLevel,
            publicConfidenceScore,
            revenueBand,
            burnRiskBand,
            publicMetadataURI
        );
    }

    function createConfidentialInvestmentIntent(
        uint256 dealId,
        externalEuint256 encryptedAmount,
        bytes calldata encryptedAmountProof
    ) external returns (uint256 investmentId) {
        return _investConfidentially(dealId, encryptedAmount, encryptedAmountProof);
    }

    function investConfidentially(
        uint256 dealId,
        externalEuint256 encryptedAmount,
        bytes calldata encryptedAmountProof
    ) external returns (uint256 investmentId) {
        return _investConfidentially(dealId, encryptedAmount, encryptedAmountProof);
    }

    function _investConfidentially(
        uint256 dealId,
        externalEuint256 encryptedAmount,
        bytes calldata encryptedAmountProof
    ) internal returns (uint256 investmentId) {
        Deal storage deal = deals[dealId];
        require(deal.active, "deal inactive");

        IERC7984 token = IERC7984(confidentialToken);
        require(token.isOperator(msg.sender, address(this)), "registry not operator");

        euint256 amount = Nox.fromExternal(encryptedAmount, encryptedAmountProof);
        Nox.allowTransient(amount, confidentialToken);
        euint256 transferredAmount = token.confidentialTransferFrom(
            msg.sender,
            deal.founder,
            amount
        );
        Nox.allowThis(transferredAmount);
        Nox.allow(transferredAmount, msg.sender);

        investmentId = nextInvestmentId++;
        investmentIntents[investmentId] = InvestmentIntent({
            id: investmentId,
            dealId: dealId,
            investor: msg.sender,
            encryptedAmount: transferredAmount,
            createdAt: block.timestamp
        });
        investorInvestmentIds[msg.sender].push(investmentId);

        emit ConfidentialInvestmentIntentCreated(
            investmentId,
            dealId,
            msg.sender,
            transferredAmount
        );
    }

    function getDeal(uint256 dealId) external view returns (Deal memory) {
        require(deals[dealId].active, "deal not found");
        return deals[dealId];
    }

    function getPublicDeal(uint256 dealId) external view returns (PublicDeal memory) {
        Deal storage deal = deals[dealId];
        require(deal.active, "deal not found");
        return
            PublicDeal({
                id: deal.id,
                founder: deal.founder,
                companyName: deal.companyName,
                sector: deal.sector,
                fundingTarget: deal.fundingTarget,
                publicMetadataURI: deal.publicMetadataURI,
                publicRiskScore: deal.publicRiskScore,
                publicRiskLevel: deal.publicRiskLevel,
                publicConfidenceScore: deal.publicConfidenceScore,
                revenueBand: deal.revenueBand,
                burnRiskBand: deal.burnRiskBand,
                active: deal.active,
                createdAt: deal.createdAt
            });
    }

    function getDealCount() external view returns (uint256) {
        return nextDealId - 1;
    }

    function getFounderDealIds(address founder) external view returns (uint256[] memory) {
        return founderDealIds[founder];
    }

    function getInvestmentIntent(
        uint256 investmentId
    ) external view returns (InvestmentIntent memory) {
        require(investmentIntents[investmentId].investor != address(0), "intent not found");
        return investmentIntents[investmentId];
    }

    function getInvestorInvestmentIds(
        address investor
    ) external view returns (uint256[] memory) {
        return investorInvestmentIds[investor];
    }

    function _allowDealFinancialHandles(Deal storage deal, address founder) private {
        _allowStoredHandle(deal.monthlyRevenue, founder);
        _allowStoredHandle(deal.monthlyBurn, founder);
        _allowStoredHandle(deal.runwayMonths, founder);
        _allowStoredHandle(deal.grossMargin, founder);
        _allowStoredHandle(deal.customerCount, founder);
        _allowStoredHandle(deal.runwayHealthSignal, founder);
        _allowStoredHandle(deal.burnDisciplineSignal, founder);
        _allowStoredHandle(deal.tractionSignal, founder);
    }

    function _allowStoredHandle(euint256 handle, address founder) private {
        Nox.allowThis(handle);
        Nox.allow(handle, founder);
    }
}
