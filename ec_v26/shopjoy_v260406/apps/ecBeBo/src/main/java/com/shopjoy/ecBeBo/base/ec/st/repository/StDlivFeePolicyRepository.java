package com.shopjoy.ecBeBo.base.ec.st.repository;

import com.shopjoy.ecBeBo.base.ec.st.data.entity.StDlivFeePolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.QStDlivFeePolicyRepository;

public interface StDlivFeePolicyRepository extends JpaRepository<StDlivFeePolicy, String>, QStDlivFeePolicyRepository {
}
