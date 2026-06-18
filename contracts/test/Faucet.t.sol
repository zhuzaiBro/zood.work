// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Faucet} from "../src/Faucet.sol";

contract FaucetTest is Test {
    Faucet faucet;
    address owner = makeAddr("owner");
    address user = makeAddr("user");

    function setUp() public {
        vm.deal(owner, 10 ether);
        vm.prank(owner);
        faucet = new Faucet(owner, 0.1 ether, 0.1 ether);
        vm.deal(address(faucet), 1 ether);
    }

    function test_claim_success() public {
        vm.prank(user);
        faucet.claim();
        assertEq(user.balance, 0.1 ether);
    }

    function test_claim_reverts_when_weekly_limit_exceeded() public {
        vm.startPrank(user);
        faucet.claim();
        vm.expectRevert(Faucet.WeeklyLimitExceeded.selector);
        faucet.claim();
        vm.stopPrank();
    }

    function test_owner_can_deposit_and_update_limits() public {
        vm.prank(owner);
        faucet.deposit{value: 1 ether}();

        vm.prank(owner);
        faucet.setClaimAmount(0.05 ether);

        vm.prank(owner);
        faucet.setWeeklyLimit(0.2 ether);

        assertEq(faucet.claimAmount(), 0.05 ether);
        assertEq(faucet.weeklyLimit(), 0.2 ether);
    }
}
