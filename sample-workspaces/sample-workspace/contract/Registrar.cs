using System.ComponentModel;
using Neo;
using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Services.Neo;

namespace DevHawk.Contracts
{
    [DisplayName("DevHawk.Registrar")]
    [ManifestExtra("Author", "Harry Pierson")]
    [ManifestExtra("Email", "harrypierson@hotmail.com")]
    [ManifestExtra("Description", "This is an example contract")]
    public class Registrar : SmartContract
    {
        public static UInt160 Query(string domain)
        {
            byte[] value = Storage.Get(Storage.CurrentContext, domain);
            return (value == null) ? UInt160.Zero : (UInt160) value;
        }

        public static bool Register(string domain, UInt160 owner)
        {
            if (!Runtime.CheckWitness(owner)) return false;
            var currentOwner = Query(domain);
            if (!currentOwner.IsZero) return false;
            Storage.Put(Storage.CurrentContext, domain, (ByteString) owner);
            return true;
        }

        public static bool Transfer(string domain, UInt160 to)
        {
            var currentOwner = Query(domain);
            if (currentOwner.IsZero) return false;
            if (!Runtime.CheckWitness(to)) return false;
            if (!Runtime.CheckWitness(currentOwner)) return false;
            Storage.Put(Storage.CurrentContext, domain, (ByteString) to);
            return true;
        }

        public static bool Delete(string domain)
        {
            var currentOwner = Query(domain);
            if (currentOwner.IsZero) return false;
            if (!Runtime.CheckWitness(currentOwner)) return false;
            Storage.Delete(Storage.CurrentContext, domain);
            return true;
        }
    }
}
