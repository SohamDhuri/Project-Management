import { useEffect } from "react";
import { useOrganizationList } from "@clerk/react";

const OrgSync = () => {
    const { isLoaded, setActive, userMemberships } = useOrganizationList({
        userMemberships: true,
    });

    useEffect(() => {
        if (!isLoaded) return;

        if (userMemberships?.data?.length > 0) {
            setActive({
                organization: userMemberships.data[0].organization.id,
            });
        }
    }, [isLoaded, userMemberships, setActive]);

    return null;
};

export default OrgSync;