package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveIssueRepository;

public interface PmSaveIssueRepository extends JpaRepository<PmSaveIssue, String>, QPmSaveIssueRepository {
}
