namespace VexPay.Constants
{
    public static class RoleNames
    {
        public const string Admin = "ADMIN";
        public const string Customer = "CUSTOMER";
        public const string Developer = "DEVELOPER";
        public const string ShopOwner = "SHOP_OWNER";

        public static readonly string[] All =
        {
            Admin,
            Customer,
            Developer,
            ShopOwner,
        };
    }
}
