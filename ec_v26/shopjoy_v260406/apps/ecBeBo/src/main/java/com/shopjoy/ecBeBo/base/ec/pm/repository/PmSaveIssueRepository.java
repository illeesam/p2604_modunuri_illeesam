package com.shopjoy.ecBeBo.base.ec.pm.repository;

import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmSaveIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmSaveIssueRepository;

public interface PmSaveIssueRepository extends JpaRepository<PmSaveIssue, String>, QPmSaveIssueRepository {
}
