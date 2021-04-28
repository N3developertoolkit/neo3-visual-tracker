using System.Collections.Generic;
using System.Linq;

using FluentAssertions;
using Neo.Assertions;
using Neo.BlockchainToolkit;
using Neo.BlockchainToolkit.Models;
using Neo.BlockchainToolkit.SmartContract;
using Neo.Persistence;
using Neo.VM;
using Neo.Wallets;
using NeoTestHarness;
using Xunit;

namespace SampleTests
{
    [CheckpointPath("../checkpoints/contract-deployed.neoxp-checkpoint")]
    public class SampleContractTests : IClassFixture<CheckpointFixture<SampleContractTests>>
    {
        readonly CheckpointFixture fixture;

        readonly ExpressChain chain;

        public SampleContractTests(CheckpointFixture<SampleContractTests> fixture)
        {
            this.fixture = fixture;
            this.chain = fixture.FindChain();
        }

        [Fact]
        public void CanStoreNumber()
        {
            using (var snapshot = this.fixture.GetSnapshot())
            {
                // TODO: Real tests
                true.Should().BeTrue();
            }
        }
    }
}
