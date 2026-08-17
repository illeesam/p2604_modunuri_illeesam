package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StDlivFeePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStDlivFeePolicyRepository;

public interface StDlivFeePolicyRepository extends JpaRepository<StDlivFeePolicy, String>, QStDlivFeePolicyRepository {
}
