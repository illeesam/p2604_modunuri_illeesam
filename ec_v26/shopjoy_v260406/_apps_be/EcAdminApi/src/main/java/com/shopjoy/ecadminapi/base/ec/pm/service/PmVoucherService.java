package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmVoucherRepository;
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
public class PmVoucherService {

    private final PmVoucherRepository pmVoucherRepository;

    @PersistenceContext
    private EntityManager em;

    /* 바우처(상품권) 키조회 */
    public PmVoucherDto.Item getById(String id) {
        PmVoucherDto.Item dto = pmVoucherRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmVoucherDto.Item getByIdOrNull(String id) {
        return pmVoucherRepository.selectById(id).orElse(null);
    }

    /* 바우처(상품권) 상세조회 */
    public PmVoucher findById(String id) {
        return pmVoucherRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmVoucher findByIdOrNull(String id) {
        return pmVoucherRepository.findById(id).orElse(null);
    }

    /* 바우처(상품권) 키검증 */
    public boolean existsById(String id) {
        return pmVoucherRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmVoucherRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 바우처(상품권) 목록조회 */
    public List<PmVoucherDto.Item> getList(PmVoucherDto.Request req) {
        return pmVoucherRepository.selectList(req);
    }

    /* 바우처(상품권) 페이지조회 */
    public PmVoucherDto.PageResponse getPageData(PmVoucherDto.Request req) {
        PageHelper.addPaging(req);
        return pmVoucherRepository.selectPageList(req);
    }

    /* 바우처(상품권) 등록 */
    @Transactional
    public PmVoucher create(PmVoucher body) {
        body.setVoucherId(CmUtil.generateId("pm_voucher"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmVoucher saved = pmVoucherRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 바우처(상품권) 수정 */
    @Transactional
    public PmVoucher update(String id, PmVoucher body) {
        CmUtil.requireId(id, "id", this);
        PmVoucher entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "voucherId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmVoucher saved = pmVoucherRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 바우처(상품권) 수정 */
    @Transactional
    public PmVoucher updateSelective(PmVoucher entity) {
        if (entity.getVoucherId() == null) throw new CmBizException("voucherId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVoucherId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVoucherId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmVoucherRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 바우처(상품권) 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmVoucher entity = findById(id);
        pmVoucherRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmVoucher save(String cmd, PmVoucher entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getVoucherId() == null || entity.getVoucherId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getVoucherId() == null)
                    throw new CmBizException("삭제 대상 voucherId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pmVoucherRepository.existsById(entity.getVoucherId()))
                    throw new CmBizException("존재하지 않는 PmVoucher입니다: " + entity.getVoucherId() + "::" + CmUtil.svcCallerInfo(this));
                pmVoucherRepository.deleteById(entity.getVoucherId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setVoucherId(CmUtil.generateId("pm_voucher"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PmVoucher saved = pmVoucherRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getVoucherId() == null)
                    throw new CmBizException("수정 대상 voucherId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pmVoucherRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PmVoucher입니다: " + entity.getVoucherId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getVoucherId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PmVoucher> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PmVoucher row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getVoucherId() == null || row.getVoucherId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PmVoucher::getVoucherId, "U", "voucherId", this);
            CmUtil.requireRowIds(rows, PmVoucher::getVoucherId, "D", "voucherId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PmVoucher::getVoucherId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pmVoucherRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PmVoucher> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PmVoucher row : updateRows) {
                row.setUpdBy(authId);
                int affected = pmVoucherRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getVoucherId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PmVoucher> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PmVoucher row : insertRows) {
                row.setVoucherId(CmUtil.generateId("pm_voucher"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmVoucherRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
