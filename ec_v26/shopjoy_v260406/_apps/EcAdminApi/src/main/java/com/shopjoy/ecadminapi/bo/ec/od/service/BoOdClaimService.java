package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdClaimMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoOdClaimService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final OdClaimMapper odClaimMapper;
    private final OdClaimRepository odClaimRepository;
    @PersistenceContext
    private EntityManager em;

    /** getList — 조회 */
    public List<OdClaimDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return odClaimMapper.selectList(p);
    }

    /** getPageData — 조회 */
    public PageResult<OdClaimDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odClaimMapper.selectPageList(p), odClaimMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** getById — 조회 */
    public OdClaimDto getById(String id) {
        OdClaimDto dto = odClaimMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** create — 생성 */
    @Transactional
    public OdClaim create(OdClaim body) {
        body.setClaimId("CL" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdClaim saved = odClaimRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public OdClaimDto update(String id, OdClaim body) {
        OdClaim entity = odClaimRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "claimId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaim saved = odClaimRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        OdClaim entity = odClaimRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        odClaimRepository.delete(entity);
        em.flush();
        if (odClaimRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** changeStatus */
    @Transactional
    public OdClaimDto changeStatus(String id, String statusCd) {
        OdClaim entity = odClaimRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setClaimStatusCdBefore(entity.getClaimStatusCd());
        entity.setClaimStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaim saved = odClaimRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    /** bulkStatus */
    @Transactional
    public void bulkStatus(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changes = (List<Map<String, Object>>) body.get("changes");
        if (changes == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (Map<String, Object> c : changes) {
            String id = (String) c.get("id");
            String statusCd = (String) c.get("statusCd");
            odClaimRepository.findById(id).ifPresent(e -> {
                e.setClaimStatusCdBefore(e.getClaimStatusCd());
                e.setClaimStatusCd(statusCd);
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdClaim saved = odClaimRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }

    /** bulkType */
    @Transactional
    public void bulkType(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        String type = (String) body.get("type");
        if (ids == null || type == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            odClaimRepository.findById(id).ifPresent(e -> {
                e.setClaimTypeCd(type);
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdClaim saved = odClaimRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }

    /** bulkApproval */
    @Transactional
    public void bulkApproval(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        if (ids == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            odClaimRepository.findById(id).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdClaim saved = odClaimRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }

    /** bulkApprovalReq */
    @Transactional
    public void bulkApprovalReq(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        if (ids == null) return;
        String updBy = SecurityUtil.getAuthUser().authId();
        for (String id : ids) {
            odClaimRepository.findById(id).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdClaim saved = odClaimRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
            });
        }
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<OdClaim> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getClaimId() != null)
            .map(OdClaim::getClaimId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odClaimRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (OdClaim row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getClaimId(), "claimId must not be null");
            OdClaim entity = odClaimRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "claimId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odClaimRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (OdClaim row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setClaimId("CL" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odClaimRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
