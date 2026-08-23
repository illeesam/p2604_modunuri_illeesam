package com.shopjoy.ecadminapi.md.cb.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.md.cb.data.dto.MdCbYarnDto;
import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbYarn;
import com.shopjoy.ecadminapi.md.cb.repository.MdCbYarnRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdCbYarnService {

    private final MdCbYarnRepository mdCbYarnRepository;

    @PersistenceContext
    private EntityManager em;

    public MdCbYarnDto.Item getById(String id) {
        MdCbYarnDto.Item dto = mdCbYarnRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public MdCbYarn findById(String id) {
        return mdCbYarnRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public boolean existsById(String id) {
        return mdCbYarnRepository.existsById(id);
    }

    public List<MdCbYarnDto.Item> getList(MdCbYarnDto.Request req) {
        return mdCbYarnRepository.selectList(req);
    }

    public BasePage<MdCbYarnDto.Item> getPageData(MdCbYarnDto.Request req) {
        PageHelper.addPaging(req);
        return mdCbYarnRepository.selectPageData(req);
    }

    @Transactional
    public MdCbYarn create(MdCbYarn body) {
        body.setYarnId(CmUtil.generateId("cb_yarn"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MdCbYarn saved = mdCbYarnRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MdCbYarn update(String id, MdCbYarn body) {
        CmUtil.requireId(id, "id", this);
        MdCbYarn entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "yarnId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MdCbYarn saved = mdCbYarnRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MdCbYarn entity = findById(id);
        mdCbYarnRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveListBase(List<MdCbYarn> rows) {
        for (MdCbYarn row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getYarnId() == null || row.getYarnId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, MdCbYarn::getYarnId, "U", "yarnId", this);
        CmUtil.requireRowIds(rows, MdCbYarn::getYarnId, "D", "yarnId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream().filter(r -> "D".equals(r.getRowStatus())).map(MdCbYarn::getYarnId).toList();
        if (!deleteIds.isEmpty()) mdCbYarnRepository.deleteAllById(deleteIds);

        List<MdCbYarn> updateRows = rows.stream().filter(r -> "U".equals(r.getRowStatus())).toList();
        for (MdCbYarn row : updateRows) {
            row.setUpdBy(authId);
            int affected = mdCbYarnRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getYarnId() + "::" + CmUtil.svcCallerInfo(this));
        }

        List<MdCbYarn> insertRows = rows.stream().filter(r -> "I".equals(r.getRowStatus())).toList();
        for (MdCbYarn row : insertRows) {
            row.setYarnId(CmUtil.generateId("cb_yarn"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mdCbYarnRepository.save(row);
        }

        em.flush();
        em.clear();
    }
}
