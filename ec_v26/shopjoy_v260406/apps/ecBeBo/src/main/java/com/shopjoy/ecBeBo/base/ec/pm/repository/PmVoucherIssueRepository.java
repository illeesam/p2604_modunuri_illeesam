package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmVoucherIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmVoucherIssueRepository;

public interface PmVoucherIssueRepository extends JpaRepository<PmVoucherIssue, String>, QPmVoucherIssueRepository {
}
