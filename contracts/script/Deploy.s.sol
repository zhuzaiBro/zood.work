// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {Faucet} from "../src/Faucet.sol";

contract DeployFaucet is Script {
    function run() external {
        uint256 deployerPrivateKey = _readPrivateKey("PK");
        address deployer = vm.addr(deployerPrivateKey);
        address owner = vm.envOr("FAUCET_OWNER", deployer);
        uint256 claimAmount = vm.envOr("FAUCET_CLAIM_AMOUNT_WEI", uint256(0.1 ether));
        uint256 weeklyLimit = vm.envOr("FAUCET_WEEKLY_LIMIT_WEI", claimAmount);

        vm.startBroadcast(deployerPrivateKey);
        new Faucet(owner, claimAmount, weeklyLimit);
        vm.stopBroadcast();
    }

    function _readPrivateKey(string memory envName) internal view returns (uint256) {
        string memory pk = vm.envString(envName);
        bytes memory pkBytes = bytes(pk);
        if (pkBytes.length >= 2 && pkBytes[0] == "0" && pkBytes[1] == "x") {
            return vm.parseUint(pk);
        }
        return vm.parseUint(string.concat("0x", pk));
    }
}
