using System;
using System.ComponentModel;
using System.Numerics;

using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Services.Neo;
using Neo.SmartContract.Framework.Services.System;

namespace Sample
{
    [DisplayName("YourName.SampleContract")]
    [ManifestExtra("Author", "Your name")]
    [ManifestExtra("Email", "your@address.invalid")]
    [ManifestExtra("Description", "Describe your contract...")]
    public class SampleContract : SmartContract
    {
        const string MAP_NAME = "SampleContract";

        [DisplayName("NumberChanged")]
        public static event Action<Neo.UInt160, BigInteger> OnNumberChanged;

        public static bool ChangeNumber(BigInteger positiveNumber)
        {
            if (positiveNumber < 0)
            {
                throw new Exception("Only positive numbers are allowed.");
            }

            var tx = (Transaction) ExecutionEngine.ScriptContainer;

            var storageMap = Storage.CurrentContext.CreateMap(MAP_NAME);

            storageMap.Put(tx.Sender, positiveNumber);

            OnNumberChanged(tx.Sender, positiveNumber);

            return true;
        }

        public static ByteString GetNumber()
        {
            var tx = (Transaction) ExecutionEngine.ScriptContainer;

            var storageMap = Storage.CurrentContext.CreateMap(MAP_NAME);

            return storageMap.Get(tx.Sender);
        }
    }
}
